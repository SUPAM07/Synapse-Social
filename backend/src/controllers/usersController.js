import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Ticket } from '../models/Ticket.js';
import { successResponse } from '../utils/responses.js';
import { sanitizeUser } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export function getUser(req, res, next) {
  try {
    const user = User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    return successResponse(res, { user: sanitizeUser(user) }, 'User retrieved');
  } catch (err) {
    next(err);
  }
}

export function updateUser(req, res, next) {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to update this user');
    }
    const updated = User.update(req.params.id, req.body);
    if (!updated) throw new NotFoundError('User not found');
    return successResponse(res, { user: sanitizeUser(updated) }, 'User updated');
  } catch (err) {
    next(err);
  }
}

export function getUserEvents(req, res, next) {
  try {
    const events = Event.findByOrganizer(req.params.id);
    return successResponse(res, { events }, 'Events retrieved');
  } catch (err) {
    next(err);
  }
}

export function getUserTickets(req, res, next) {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to view this user\'s tickets');
    }
    const tickets = Ticket.findByUser(req.params.id);
    return successResponse(res, { tickets }, 'Tickets retrieved');
  } catch (err) {
    next(err);
  }
}
