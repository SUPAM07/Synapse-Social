import { jest } from '@jest/globals';

// ----- Mocks -----

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
};

jest.mock('../../src/db.js', () => ({
  getPool: jest.fn(() => mockPool),
}));

jest.mock('../../src/kafka.js', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/config.js', () => ({
  env: {
    eventServiceUrl: 'http://mock-event-service',
  },
}));

jest.mock('qrcode', () => ({
  default: { toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr') },
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
}));

import { getPool } from '../../src/db.js';
import { publishEvent } from '../../src/kafka.js';
import {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
} from '../../src/controllers/bookingController.js';

// ----- Helpers -----
function mockReq(body = {}, user = { id: 'user1', email: 'user@test.com', role: 'customer' }, params = {}) {
  return { body, user, params };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeEvent(overrides = {}) {
  return {
    _id: 'event1',
    title: 'Test Event',
    status: 'approved',
    availableSeats: 10,
    ...overrides,
  };
}

// ----- Tests -----
describe('bookingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  // ----------------------------------------------------------------
  describe('createBooking', () => {
    function setupFetchMock(event) {
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/seats')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({
          ok: !!event,
          json: () => Promise.resolve({ data: event }),
        });
      });
    }

    it('creates a booking and returns 201 on success', async () => {
      setupFetchMock(makeEvent());
      // BEGIN → no duplicate → INSERT → COMMIT
      mockClient.query
        .mockResolvedValueOnce(undefined)           // BEGIN
        .mockResolvedValueOnce({ rows: [] })         // duplicate check (none)
        .mockResolvedValueOnce({                     // INSERT
          rows: [{ id: 1, user_id: 'user1', event_id: 'event1', status: 'confirmed', qr_code: 'qr' }],
        })
        .mockResolvedValueOnce(undefined);           // COMMIT

      const req = mockReq({ eventId: 'event1' });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Booking confirmed' })
      );
      expect(publishEvent).toHaveBeenCalledWith('ticket-booked', expect.any(Object));
    });

    it('returns 400 when eventId is missing', async () => {
      const req = mockReq({});
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it('returns 404 when event is not found', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ data: null }) });

      const req = mockReq({ eventId: 'unknown-event' });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when event is not approved', async () => {
      setupFetchMock(makeEvent({ status: 'pending' }));

      const req = mockReq({ eventId: 'event1' });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Event is not available for booking' })
      );
    });

    it('returns 409 when no seats are available', async () => {
      setupFetchMock(makeEvent({ availableSeats: 0 }));

      const req = mockReq({ eventId: 'event1' });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No seats available' })
      );
    });

    it('returns 409 and rollbacks on duplicate booking', async () => {
      setupFetchMock(makeEvent());
      mockClient.query
        .mockResolvedValueOnce(undefined)                          // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 99 }] });           // duplicate check (found)

      const req = mockReq({ eventId: 'event1' });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      const rollbackCalled = mockClient.query.mock.calls.some(([q]) => q === 'ROLLBACK');
      expect(rollbackCalled).toBe(true);
    });

    it('releases the DB client after booking attempt', async () => {
      setupFetchMock(makeEvent());
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 2, user_id: 'user1', event_id: 'event1', status: 'confirmed', qr_code: 'qr' }] })
        .mockResolvedValueOnce(undefined);

      const req = mockReq({ eventId: 'event1' });
      const res = mockRes();

      await createBooking(req, res);

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  describe('getBooking', () => {
    it('returns booking for the owner', async () => {
      const booking = { id: 1, user_id: 'user1', event_id: 'event1', status: 'confirmed' };
      mockPool.query.mockResolvedValue({ rows: [booking] });

      const req = mockReq({}, { id: 'user1', role: 'customer' }, { id: '1' });
      const res = mockRes();

      await getBooking(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { booking } })
      );
    });

    it('returns 404 when booking not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const req = mockReq({}, { id: 'user1', role: 'customer' }, { id: '999' });
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when a non-owner non-admin accesses the booking', async () => {
      const booking = { id: 1, user_id: 'otherUser', event_id: 'event1', status: 'confirmed' };
      mockPool.query.mockResolvedValue({ rows: [booking] });

      const req = mockReq({}, { id: 'user1', role: 'customer' }, { id: '1' });
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows admin to access any booking', async () => {
      const booking = { id: 1, user_id: 'otherUser', event_id: 'event1', status: 'confirmed' };
      mockPool.query.mockResolvedValue({ rows: [booking] });

      const req = mockReq({}, { id: 'adminId', role: 'admin' }, { id: '1' });
      const res = mockRes();

      await getBooking(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ----------------------------------------------------------------
  describe('getUserBookings', () => {
    it('returns bookings for the requesting user', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const req = mockReq({}, { id: 'user1', role: 'customer' }, { userId: 'user1' });
      const res = mockRes();

      await getUserBookings(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: 1 }, { id: 2 }] }));
    });

    it('returns 403 when user tries to access another user bookings', async () => {
      const req = mockReq({}, { id: 'user1', role: 'customer' }, { userId: 'user2' });
      const res = mockRes();

      await getUserBookings(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ----------------------------------------------------------------
  describe('cancelBooking', () => {
    it('cancels a confirmed booking', async () => {
      const booking = { id: 1, user_id: 'user1', event_id: 'event1', status: 'cancelled' };
      mockClient.query
        .mockResolvedValueOnce(undefined)           // BEGIN
        .mockResolvedValueOnce({ rows: [booking] }) // UPDATE
        .mockResolvedValueOnce(undefined);          // COMMIT

      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const req = mockReq({}, { id: 'user1', role: 'customer' }, { id: '1' });
      const res = mockRes();

      await cancelBooking(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Booking cancelled' })
      );
      expect(publishEvent).toHaveBeenCalledWith('ticket-cancelled', expect.any(Object));
    });

    it('returns 404 when booking not found or already cancelled', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)          // BEGIN
        .mockResolvedValueOnce({ rows: [] });      // UPDATE (no rows = not found)

      const req = mockReq({}, { id: 'user1', role: 'customer' }, { id: '999' });
      const res = mockRes();

      await cancelBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
