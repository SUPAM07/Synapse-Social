import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String },
    eventId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });
reviewSchema.index({ eventId: 1 });

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
