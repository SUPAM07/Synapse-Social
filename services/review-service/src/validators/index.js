import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, 'rating must be between 1 and 5')
    .max(5, 'rating must be between 1 and 5'),
  comment: z.string().max(2000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});
