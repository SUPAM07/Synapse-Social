import Review from '../models/Review.js';
import { publishEvent } from '../kafka.js';

export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const eventId = req.params.eventId;

    if (!rating) return res.status(400).json({ success: false, message: 'rating is required' });

    const existing = await Review.findOne({ userId: req.user.id, eventId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this event' });
    }

    const review = await Review.create({
      userId: req.user.id,
      userName: req.user.name,
      eventId,
      rating,
      comment,
    });

    await publishEvent('review-posted', {
      eventId,
      userId: req.user.id,
      data: { reviewId: review._id, rating },
    });

    res.status(201).json({ success: true, message: 'Review created', data: { review } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this event' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEventReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { rating, comment },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: { review } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEventStats = async (req, res) => {
  try {
    const agg = await Review.aggregate([
      { $match: { eventId: req.params.eventId } },
      {
        $group: {
          _id: '$eventId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: { $push: '$rating' },
        },
      },
    ]);
    const stats = agg[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
