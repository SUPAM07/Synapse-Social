import Joi from 'joi';
import { EVENT_CATEGORIES } from '../config/constants.js';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  imageUrl: Joi.string().uri().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  country: Joi.string().optional().allow(''),
  interests: Joi.array().items(Joi.string()).optional(),
  hasCompletedOnboarding: Joi.boolean().optional(),
  isOnboarded: Joi.number().integer().min(0).max(1).optional(),
  location: Joi.object({
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
  }).optional(),
});

export const createEventSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(10).required(),
  category: Joi.string().valid(...EVENT_CATEGORIES).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  timezone: Joi.string().optional().allow(''),
  locationType: Joi.string().valid('physical', 'online').optional(),
  venue: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  country: Joi.string().optional().allow(''),
  capacity: Joi.number().min(1).required(),
  ticketType: Joi.string().valid('free', 'paid').optional(),
  ticketPrice: Joi.number().min(0).default(0).optional(),
  coverImage: Joi.string().optional().allow(''),
  themeColor: Joi.string().optional().allow(''),
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().min(10).optional(),
  category: Joi.string().valid(...EVENT_CATEGORIES).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  timezone: Joi.string().optional().allow(''),
  locationType: Joi.string().valid('physical', 'online').optional(),
  venue: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  country: Joi.string().optional().allow(''),
  capacity: Joi.number().min(1).optional(),
  ticketType: Joi.string().valid('free', 'paid').optional(),
  ticketPrice: Joi.number().min(0).optional(),
  coverImage: Joi.string().optional().allow(''),
  themeColor: Joi.string().optional().allow(''),
});

export const purchaseTicketSchema = Joi.object({
  attendeeName: Joi.string().required(),
  attendeeEmail: Joi.string().email().required(),
});
