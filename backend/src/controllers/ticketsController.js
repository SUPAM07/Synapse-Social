import * as ticketsService from '../services/ticketsService.js';
import { successResponse } from '../utils/responses.js';

export function getUserTickets(req, res, next) {
  try {
    const tickets = ticketsService.getUserTickets(req.user.id);
    return successResponse(res, { tickets }, 'Tickets retrieved');
  } catch (err) {
    next(err);
  }
}

export function getTicket(req, res, next) {
  try {
    const ticket = ticketsService.getTicketById(req.params.id, req.user.id);
    return successResponse(res, { ticket }, 'Ticket retrieved');
  } catch (err) {
    next(err);
  }
}

export async function purchaseTicket(req, res, next) {
  try {
    const ticket = ticketsService.purchaseTicket(req.params.eventId, req.user.id, req.body);
    return successResponse(res, { ticket }, 'Ticket purchased successfully', 201);
  } catch (err) {
    next(err);
  }
}

export function cancelTicket(req, res, next) {
  try {
    const ticket = ticketsService.cancelTicket(req.params.id, req.user.id);
    return successResponse(res, { ticket }, 'Ticket cancelled');
  } catch (err) {
    next(err);
  }
}

export function checkInAttendee(req, res, next) {
  try {
    const ticket = ticketsService.checkInAttendee(req.params.qrCode, req.user.id);
    return successResponse(res, { ticket }, 'Attendee checked in');
  } catch (err) {
    next(err);
  }
}
