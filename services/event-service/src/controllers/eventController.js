import Event from '../models/Event.js';
import { getRedis } from '../server.js';
import { publishEvent } from '../kafka.js';

const CACHE_TTL = 3600;       // 1 hour
const TRENDING_TTL = 1800;    // 30 min

export const createEvent = async (req, res) => {
  try {
    const posterUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const event = await Event.create({
      ...req.body,
      organizerId: req.user.id,
      organizerName: req.user.name,
      availableSeats: req.body.capacity || 0,
      posterUrl,
    });

    // Invalidate trending cache
    const redis = getRedis();
    if (redis) await redis.del('trending:events');

    await publishEvent('event-created', { eventId: event._id, userId: req.user.id, data: { title: event.title } });

    res.status(201).json({ success: true, message: 'Event created', data: { event } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const posterUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const update = { ...req.body };
    if (posterUrl) update.posterUrl = posterUrl;

    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.organizerId = req.user.id;

    const event = await Event.findOneAndUpdate(query, update, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Invalidate cache
    const redis = getRedis();
    if (redis) {
      await redis.del(`event:${req.params.id}`);
      await redis.del('trending:events');
    }

    res.json({ success: true, data: { event } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.organizerId = req.user.id;

    const event = await Event.findOneAndDelete(query);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const redis = getRedis();
    if (redis) {
      await redis.del(`event:${req.params.id}`);
      await redis.del('trending:events');
    }

    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listEvents = async (req, res) => {
  try {
    const { q, category, status, organizer, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (organizer) filter.organizerId = organizer;

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = `event:${req.params.id}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json({ success: true, data: JSON.parse(cached), fromCache: true });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (redis) await redis.set(cacheKey, JSON.stringify(event), 'EX', CACHE_TTL);

    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const searchEvents = async (req, res) => {
  try {
    const { q, category, startDate, endDate, minCapacity, page = 1, limit = 20 } = req.query;
    const filter = { status: 'approved' };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (minCapacity) filter.capacity = { $gte: Number(minCapacity) };

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const redis = getRedis();
    if (redis) await redis.del(`event:${req.params.id}`);

    await publishEvent('event-approved', { eventId: event._id, data: { title: event.title } });

    res.json({ success: true, data: { event } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const redis = getRedis();
    if (redis) await redis.del(`event:${req.params.id}`);

    res.json({ success: true, data: { event } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const trendingEvents = async (_req, res) => {
  try {
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get('trending:events');
      if (cached) return res.json({ success: true, data: JSON.parse(cached), fromCache: true });
    }

    const events = await Event.find({ status: 'approved' })
      .sort({ averageRating: -1, date: 1 })
      .limit(10);

    if (redis) await redis.set('trending:events', JSON.stringify(events), 'EX', TRENDING_TTL);

    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEventSeats = async (req, res) => {
  try {
    const { delta } = req.body; // negative = decrement, positive = increment
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { availableSeats: delta } },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const redis = getRedis();
    if (redis) await redis.del(`event:${req.params.id}`);

    res.json({ success: true, data: { availableSeats: event.availableSeats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
