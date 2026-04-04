import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

export const createEvent = async (req, res) => {
  try {
    const posterUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const event = await Event.create({ ...req.body, organizer: req.user.id, posterUrl });
    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const posterUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const update = { ...req.body };
    if (posterUrl) update.posterUrl = posterUrl;
    const event = await Event.findOneAndUpdate({ _id: req.params.id, organizer: req.user.id }, update, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listEvents = async (req, res) => {
  try {
    const { q, category, status, organizer } = req.query;
    const filter = {};
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (organizer) filter.organizer = organizer;
    const events = await Event.find(filter).populate('organizer', 'name').sort({ date: 1 });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name');
    if (!event) return res.status(404).json({ message: 'Not found' });
    const count = await Registration.countDocuments({ event: event._id, status: { $ne: 'cancelled' } });
    res.json({ event, registrations: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


