import { jest } from '@jest/globals';

// ----- Mocks -----

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock('../../src/server.js', () => ({
  getRedis: jest.fn(() => mockRedis),
}));

jest.mock('../../src/kafka.js', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/models/Event.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  },
}));

import Event from '../../src/models/Event.js';
import { publishEvent } from '../../src/kafka.js';
import { getRedis } from '../../src/server.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
  getEvent,
  approveEvent,
  rejectEvent,
  updateEventSeats,
} from '../../src/controllers/eventController.js';

// ----- Helpers -----
function mockReq(body = {}, user = { id: 'org1', name: 'Organizer', role: 'organizer' }, params = {}, query = {}, file = null) {
  return { body, user, params, query, file };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function fakeEvent(overrides = {}) {
  return {
    _id: 'evt1',
    title: 'Test Event',
    description: 'A test event',
    date: new Date().toISOString(),
    venue: 'Test Venue',
    category: 'tech',
    capacity: 100,
    availableSeats: 100,
    status: 'pending',
    organizerId: 'org1',
    ...overrides,
  };
}

// ----- Tests -----
describe('eventController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRedis.mockReturnValue(mockRedis);
  });

  // ----------------------------------------------------------------
  describe('createEvent', () => {
    it('creates an event and returns 201', async () => {
      const event = fakeEvent();
      Event.create.mockResolvedValue(event);

      const req = mockReq({
        title: 'Test Event',
        description: 'desc',
        date: new Date().toISOString(),
        venue: 'Venue',
        category: 'tech',
        capacity: 50,
      });
      const res = mockRes();

      await createEvent(req, res);

      expect(Event.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Event created', data: { event } })
      );
    });

    it('publishes an event-created Kafka message', async () => {
      Event.create.mockResolvedValue(fakeEvent());

      const req = mockReq({ title: 'Ev', description: 'd', date: new Date().toISOString(), venue: 'V', category: 'c' });
      const res = mockRes();

      await createEvent(req, res);

      expect(publishEvent).toHaveBeenCalledWith('event-created', expect.any(Object));
    });

    it('returns 500 on database error', async () => {
      Event.create.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ title: 'Ev', description: 'd', date: new Date().toISOString(), venue: 'V', category: 'c' });
      const res = mockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ----------------------------------------------------------------
  describe('updateEvent', () => {
    it('updates an event and returns it', async () => {
      const updated = fakeEvent({ title: 'Updated Title' });
      Event.findOneAndUpdate.mockResolvedValue(updated);

      const req = mockReq({ title: 'Updated Title' }, { id: 'org1', role: 'organizer' }, { id: 'evt1' });
      const res = mockRes();

      await updateEvent(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { event: updated } })
      );
    });

    it('returns 404 when event not found', async () => {
      Event.findOneAndUpdate.mockResolvedValue(null);

      const req = mockReq({}, { id: 'org1', role: 'organizer' }, { id: 'nonexistent' });
      const res = mockRes();

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('invalidates the event cache on update', async () => {
      const updated = fakeEvent();
      Event.findOneAndUpdate.mockResolvedValue(updated);

      const req = mockReq({ title: 'New' }, { id: 'org1', role: 'organizer' }, { id: 'evt1' });
      const res = mockRes();

      await updateEvent(req, res);

      expect(mockRedis.del).toHaveBeenCalledWith('event:evt1');
    });
  });

  // ----------------------------------------------------------------
  describe('deleteEvent', () => {
    it('deletes an event and returns success', async () => {
      const event = fakeEvent();
      Event.findOneAndDelete.mockResolvedValue(event);

      const req = mockReq({}, { id: 'org1', role: 'organizer' }, { id: 'evt1' });
      const res = mockRes();

      await deleteEvent(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when event not found', async () => {
      Event.findOneAndDelete.mockResolvedValue(null);

      const req = mockReq({}, { id: 'org1', role: 'organizer' }, { id: 'evt1' });
      const res = mockRes();

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ----------------------------------------------------------------
  describe('listEvents', () => {
    it('returns a paginated list of events', async () => {
      const events = [fakeEvent(), fakeEvent({ _id: 'evt2' })];
      const findMock = { sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue(events) };
      Event.find.mockReturnValue(findMock);
      Event.countDocuments.mockResolvedValue(2);

      const req = mockReq({}, null, {}, { page: '1', limit: '20' });
      const res = mockRes();

      await listEvents(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: events,
          pagination: expect.objectContaining({ total: 2, page: 1 }),
        })
      );
    });
  });

  // ----------------------------------------------------------------
  describe('getEvent', () => {
    it('returns event from DB when not cached', async () => {
      const event = fakeEvent();
      mockRedis.get.mockResolvedValue(null);
      Event.findById.mockResolvedValue(event);

      const req = mockReq({}, null, { id: 'evt1' });
      const res = mockRes();

      await getEvent(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: event })
      );
    });

    it('returns cached event when available', async () => {
      const event = fakeEvent();
      mockRedis.get.mockResolvedValue(JSON.stringify(event));

      const req = mockReq({}, null, { id: 'evt1' });
      const res = mockRes();

      await getEvent(req, res);

      expect(Event.findById).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, fromCache: true })
      );
    });

    it('returns 404 when event not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      Event.findById.mockResolvedValue(null);

      const req = mockReq({}, null, { id: 'nonexistent' });
      const res = mockRes();

      await getEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ----------------------------------------------------------------
  describe('approveEvent', () => {
    it('sets event status to approved', async () => {
      const event = fakeEvent({ status: 'approved' });
      Event.findByIdAndUpdate.mockResolvedValue(event);

      const req = mockReq({}, { id: 'admin1', role: 'admin' }, { id: 'evt1' });
      const res = mockRes();

      await approveEvent(req, res);

      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith('evt1', { status: 'approved' }, { new: true });
      expect(publishEvent).toHaveBeenCalledWith('event-approved', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ----------------------------------------------------------------
  describe('updateEventSeats', () => {
    it('decrements available seats', async () => {
      const event = fakeEvent({ availableSeats: 9 });
      Event.findByIdAndUpdate.mockResolvedValue(event);

      const req = mockReq({ delta: -1 }, null, { id: 'evt1' });
      const res = mockRes();

      await updateEventSeats(req, res);

      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith(
        'evt1',
        { $inc: { availableSeats: -1 } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { availableSeats: 9 } })
      );
    });
  });
});
