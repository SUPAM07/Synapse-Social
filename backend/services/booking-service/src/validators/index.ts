import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
});

export const cancelBookingSchema = z.object({});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
