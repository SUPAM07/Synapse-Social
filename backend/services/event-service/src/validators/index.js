import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'title is required').max(200),
  description: z.string().min(1, 'description is required'),
  date: z.string().min(1, 'date is required').refine((v) => !isNaN(Date.parse(v)), { message: 'date must be a valid ISO date' }),
  venue: z.string().min(1, 'venue is required'),
  category: z.string().min(1, 'category is required'),
  capacity: z.coerce.number().int().min(1, 'capacity must be at least 1').optional(),
  ticketPrice: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'date must be a valid ISO date' }).optional(),
  venue: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  ticketPrice: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export const listEventsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  organizer: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
