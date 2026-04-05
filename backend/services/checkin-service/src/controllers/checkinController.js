import { getRedis, getIo } from '../server.js';
import { publishEvent } from '../kafka.js';

export const qrCheckin = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ success: false, message: 'qrData is required' });

    let payload;
    try {
      payload = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid QR data' });
    }

    const { userId, eventId } = payload;
    if (!userId || !eventId) {
      return res.status(400).json({ success: false, message: 'Invalid QR payload' });
    }

    const redis = getRedis();
    const checkinKey = `checkin:${eventId}:${userId}`;

    if (redis) {
      const alreadyCheckedIn = await redis.get(checkinKey);
      if (alreadyCheckedIn) {
        return res.status(409).json({ success: false, message: 'Already checked in' });
      }
      await redis.set(checkinKey, JSON.stringify({ userId, eventId, checkedInAt: new Date() }), 'EX', 86400);
    }

    // Emit real-time update
    const io = getIo();
    if (io) {
      io.to(`event:${eventId}`).emit('checkin', { userId, eventId, checkedInAt: new Date().toISOString() });
    }

    await publishEvent('checkin-success', { eventId, userId, data: { method: 'qr' } });

    res.json({ success: true, message: 'Check-in successful', data: { userId, eventId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const manualCheckin = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json({ success: false, message: 'userId and eventId are required' });
    }

    const redis = getRedis();
    const checkinKey = `checkin:${eventId}:${userId}`;

    if (redis) {
      const alreadyCheckedIn = await redis.get(checkinKey);
      if (alreadyCheckedIn) {
        return res.status(409).json({ success: false, message: 'Already checked in' });
      }
      await redis.set(checkinKey, JSON.stringify({ userId, eventId, checkedInAt: new Date() }), 'EX', 86400);
    }

    const io = getIo();
    if (io) {
      io.to(`event:${eventId}`).emit('checkin', { userId, eventId, checkedInAt: new Date().toISOString() });
    }

    await publishEvent('checkin-success', { eventId, userId, data: { method: 'manual' } });

    res.json({ success: true, message: 'Manual check-in successful', data: { userId, eventId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEventCheckinStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const redis = getRedis();
    if (!redis) return res.json({ success: true, data: { total: 0, checkins: [] } });

    const keys = await redis.keys(`checkin:${eventId}:*`);
    const checkins = keys.length > 0
      ? await Promise.all(keys.map(k => redis.get(k).then(v => v ? JSON.parse(v) : null)))
      : [];

    res.json({ success: true, data: { total: checkins.filter(Boolean).length, checkins: checkins.filter(Boolean) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
