import * as eventsService from '../services/eventsService.js';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { calculatePagination } from '../utils/helpers.js';

export function getEvents(req, res, next) {
  try {
    const { category, city, country, search, page, limit } = req.query;
    const pagination = calculatePagination(page, limit);
    const { events, total } = eventsService.getEvents({ category, city, country, search }, pagination);
    return paginatedResponse(res, events, total, pagination.page, pagination.limit);
  } catch (err) {
    next(err);
  }
}

export function getEvent(req, res, next) {
  try {
    const event = eventsService.getEventById(req.params.id);
    return successResponse(res, { event }, 'Event retrieved');
  } catch (err) {
    next(err);
  }
}

export function getEventBySlug(req, res, next) {
  try {
    const event = eventsService.getEventBySlug(req.params.slug);
    return successResponse(res, { event }, 'Event retrieved');
  } catch (err) {
    next(err);
  }
}

export function createEvent(req, res, next) {
  try {
    const event = eventsService.createEvent(req.user.id, req.body);
    return successResponse(res, { event }, 'Event created', 201);
  } catch (err) {
    next(err);
  }
}

export function updateEvent(req, res, next) {
  try {
    const event = eventsService.updateEvent(req.params.id, req.user.id, req.body);
    return successResponse(res, { event }, 'Event updated');
  } catch (err) {
    next(err);
  }
}

export function deleteEvent(req, res, next) {
  try {
    const result = eventsService.deleteEvent(req.params.id, req.user.id);
    return successResponse(res, result, 'Event deleted');
  } catch (err) {
    next(err);
  }
}

export function getEventAttendees(req, res, next) {
  try {
    const attendees = eventsService.getEventAttendees(req.params.id, req.user.id);
    return successResponse(res, { attendees }, 'Attendees retrieved');
  } catch (err) {
    next(err);
  }
}

export function getMyEvents(req, res, next) {
  try {
    const events = eventsService.getUserEvents(req.user.id);
    return successResponse(res, { events }, 'Events retrieved');
  } catch (err) {
    next(err);
  }
}
