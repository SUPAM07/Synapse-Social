import QRCode from 'qrcode';
import { getPool } from '../db.js';
import { publishEvent } from '../kafka.js';
import { env } from '../config.js';

async function fetchEvent(eventId) {
  try {
    const response = await fetch(`${env.eventServiceUrl}/${eventId}`);
    if (!response.ok) return null;
    const json = await response.json();
    return json.data;
  } catch {
    return null;
  }
}

export const createBooking = async (req, res) => {
  const client = await getPool().connect();
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' });

    // Fetch event to verify it is approved and has seats
    const event = await fetchEvent(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'approved') return res.status(400).json({ success: false, message: 'Event is not available for booking' });
    if (event.availableSeats !== undefined && event.availableSeats <= 0) {
      return res.status(409).json({ success: false, message: 'No seats available' });
    }

    await client.query('BEGIN');

    // Check for duplicate booking (unique constraint also handles this)
    const existing = await client.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND event_id = $2',
      [req.user.id, eventId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'You have already booked this event' });
    }

    // Generate QR code
    const qrPayload = JSON.stringify({ userId: req.user.id, eventId, ts: Date.now() });
    const qrCode = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M' });

    const result = await client.query(
      'INSERT INTO bookings (user_id, event_id, status, qr_code) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, eventId, 'confirmed', qrCode]
    );

    await client.query('COMMIT');

    const booking = result.rows[0];

    // Notify event service to decrement available seats
    try {
      await fetch(`${env.eventServiceUrl}/${eventId}/seats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1 }),
      });
    } catch {
      // Non-critical – booking succeeded
    }

    await publishEvent('ticket-booked', {
      eventId,
      userId: req.user.id,
      data: { bookingId: booking.id, userEmail: req.user.email, eventTitle: event.title },
    });

    res.status(201).json({ success: true, message: 'Booking confirmed', data: { booking } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'You have already booked this event' });
    }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

export const getBooking = async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: { booking } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const result = await getPool().query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY booked_at DESC', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1 AND user_id = $2 AND status = 'confirmed' RETURNING *",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found or already cancelled' });
    }
    await client.query('COMMIT');
    const booking = result.rows[0];

    // Restore seat count
    try {
      await fetch(`${env.eventServiceUrl}/${booking.event_id}/seats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 1 }),
      });
    } catch {
      // Non-critical
    }

    await publishEvent('ticket-cancelled', {
      eventId: booking.event_id,
      userId: req.user.id,
      data: { bookingId: booking.id },
    });

    res.json({ success: true, message: 'Booking cancelled', data: { booking } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

export const getQrCode = async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: { qrCode: booking.qr_code, bookingId: booking.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
