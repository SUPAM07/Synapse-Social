import { z } from 'zod';

export const qrCheckinSchema = z.object({
  qrData: z.string().min(1, 'qrData is required'),
});

export const manualCheckinSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  eventId: z.string().min(1, 'eventId is required'),
});
