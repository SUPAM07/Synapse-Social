import { Event } from '../models/Event.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { generateSlug } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { FREE_EVENT_LIMIT } from '../config/constants.js';

export function getEvents(filters = {}, pagination = {}) {
  return Event.findAll(filters, pagination);
}

export function getEventById(id) {
  const event = Event.findById(id);
  if (!event) throw new NotFoundError('Event not found');
  return event;
}

export function getEventBySlug(slug) {
  const event = Event.findBySlug(slug);
  if (!event) throw new NotFoundError('Event not found');
  return event;
}

export function createEvent(organizerId, eventData) {
  const organizer = User.findById(organizerId);
  if (!organizer) throw new NotFoundError('Organizer not found');

  if (eventData.ticketType === 'free' || !eventData.ticketType) {
    if (organizer.freeEventsCreated >= FREE_EVENT_LIMIT && organizer.role === 'user') {
      throw new ForbiddenError(`Free event limit of ${FREE_EVENT_LIMIT} reached. Upgrade to organizer role.`);
    }
  }

  const slug = generateSlug(eventData.title);
  const event = Event.create({ ...eventData, organizerId, slug });

  if (eventData.ticketType === 'free' || !eventData.ticketType) {
    User.incrementFreeEventsCreated(organizerId);
  }

  return event;
}

export function updateEvent(eventId, organizerId, updates) {
  const event = Event.findById(eventId);
  if (!event) throw new NotFoundError('Event not found');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Not authorized to update this event');
  return Event.update(eventId, updates);
}

export function deleteEvent(eventId, organizerId) {
  const event = Event.findById(eventId);
  if (!event) throw new NotFoundError('Event not found');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Not authorized to delete this event');
  Event.delete(eventId);
  return { message: 'Event deleted successfully' };
}

export function getEventAttendees(eventId, organizerId) {
  const event = Event.findById(eventId);
  if (!event) throw new NotFoundError('Event not found');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Not authorized to view attendees');
  return Ticket.findByEvent(eventId);
}

export function getUserEvents(userId) {
  return Event.findByOrganizer(userId);
}
