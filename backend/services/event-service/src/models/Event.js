import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    organizerId: { type: String, required: true },
    organizerName: { type: String },
    posterUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    tags: [{ type: String }],
    averageRating: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Event = mongoose.model('Event', eventSchema);
export default Event;
