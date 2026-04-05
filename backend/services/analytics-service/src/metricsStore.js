// In-memory metrics store (replace with Redis/time-series DB in production)
const metrics = {
  totalBookings: 0,
  totalCancellations: 0,
  totalCheckins: 0,
  totalReviews: 0,
  totalEvents: 0,
  bookingsByEvent: {},   // eventId → count
  checkinsByEvent: {},   // eventId → count
  reviewsByEvent: {},    // eventId → { total, sumRating }
  recentActivity: [],    // last 100 events
};

export function getMetrics() {
  return metrics;
}

export function recordBooking(eventId) {
  metrics.totalBookings++;
  metrics.bookingsByEvent[eventId] = (metrics.bookingsByEvent[eventId] || 0) + 1;
  addActivity('booking', eventId);
}

export function recordCancellation(eventId) {
  metrics.totalCancellations++;
  addActivity('cancellation', eventId);
}

export function recordCheckin(eventId) {
  metrics.totalCheckins++;
  metrics.checkinsByEvent[eventId] = (metrics.checkinsByEvent[eventId] || 0) + 1;
  addActivity('checkin', eventId);
}

export function recordReview(eventId, rating) {
  metrics.totalReviews++;
  if (!metrics.reviewsByEvent[eventId]) {
    metrics.reviewsByEvent[eventId] = { total: 0, sumRating: 0 };
  }
  metrics.reviewsByEvent[eventId].total++;
  metrics.reviewsByEvent[eventId].sumRating += rating || 0;
  addActivity('review', eventId);
}

export function recordEventCreated(eventId) {
  metrics.totalEvents++;
  addActivity('event-created', eventId);
}

function addActivity(type, eventId) {
  metrics.recentActivity.unshift({ type, eventId, at: new Date().toISOString() });
  if (metrics.recentActivity.length > 100) metrics.recentActivity.pop();
}
