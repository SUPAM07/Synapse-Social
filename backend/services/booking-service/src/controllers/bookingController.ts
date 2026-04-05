import QRCode from 'qrcode';
import type { Request, Response } from 'express';
import { getPool } from '../db.js';
import { publishEvent } from '../kafka.js';
import { env } from '../config.js';
import type { EventData, BookingRow } from '../types.js';

async function fetchEvent(eventId: string): Promise<EventData | null> {
  try {
    const response = await fetch(`${env.eventServiceUrl}/${eventId}`);
    if (!response.ok) return null;
    const json = (await response.json()) as { data: EventData };
    return json.data;
  } catch {
    return null;
  }
}

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const client = await getPool().connect();
  try {
    const { eventId } = req.body as { eventId: string };
    if (!eventId) {
      res.status(400).json({ success: false, message: 'eventId is required' });
      return;
    }

    const event = await fetchEvent(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.status !== 'approved') {
      res.status(400).json({ success: false, message: 'Event is not available for booking' });
      return;
    }
    if (event.availableSeats !== undefined && event.availableSeats <= 0) {
      res.status(409).json({ success: false, message: 'No seats available' });
      return;
    }

    await client.query('BEGIN');

    const existing = await client.query<BookingRow>(
      'SELECT id FROM bookings WHERE user_id = $1 AND event_id = $2',
      [req.user!.id, eventId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ success: false, message: 'You have already booked this event' });
      return;
    }

    const qrPayload = JSON.stringify({ userId: req.user!.id, eventId, ts: Date.now() });
    const qrCode = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M' });

    const result = await client.query<BookingRow>(
      'INSERT INTO bookings (user_id, event_id, status, qr_code) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user!.id, eventId, 'confirmed', qrCode]
    );

    await client.query('COMMIT');

    const booking = result.rows[0];

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
      userId: req.user!.id,
      data: { bookingId: booking.id, userEmail: req.user!.email, eventTitle: event.title },
    });

    res.status(201).json({ success: true, message: 'Booking confirmed', data: { booking } });
  } catch (err) {
    await client.query('ROLLBACK');
    if ((err as NodeJS.ErrnoException).code === '23505') {
      res.status(409).json({ success: false, message: 'You have already booked this event' });
      return;
    }
    res.status(500).json({ success: false, message: (err as Error).message });
  } finally {
    client.release();
  }
};

export const getBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getPool().query<BookingRow>(
      'SELECT * FROM bookings WHERE id = $1',
      [req.params.id]
    );
    const booking = result.rows[0];
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    if (booking.user_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    res.json({ success: true, data: { booking } });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    const result = await getPool().query<BookingRow>(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY booked_at DESC',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<BookingRow>(
      "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1 AND user_id = $2 AND status = 'confirmed' RETURNING *",
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        message: 'Booking not found or already cancelled',
      });
      return;
    }
    await client.query('COMMIT');
    const booking = result.rows[0];

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
      userId: req.user!.id,
      data: { bookingId: booking.id },
    });

    res.json({ success: true, message: 'Booking cancelled', data: { booking } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: (err as Error).message });
  } finally {
    client.release();
  }
};

export const getQrCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getPool().query<BookingRow>(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );
    const booking = result.rows[0];
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: { qrCode: booking.qr_code, bookingId: booking.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
