import { getMetrics } from '../metricsStore.js';

export const getOverview = (_req, res) => {
  const m = getMetrics();
  res.json({
    success: true,
    data: {
      totalBookings: m.totalBookings,
      totalCancellations: m.totalCancellations,
      totalCheckins: m.totalCheckins,
      totalReviews: m.totalReviews,
      totalEvents: m.totalEvents,
    },
  });
};

export const getTopEvents = (_req, res) => {
  const m = getMetrics();
  const topBookings = Object.entries(m.bookingsByEvent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([eventId, count]) => ({ eventId, bookings: count }));

  const topCheckins = Object.entries(m.checkinsByEvent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([eventId, count]) => ({ eventId, checkins: count }));

  res.json({ success: true, data: { topByBookings: topBookings, topByCheckins: topCheckins } });
};

export const getRecentActivity = (_req, res) => {
  const m = getMetrics();
  res.json({ success: true, data: m.recentActivity });
};
