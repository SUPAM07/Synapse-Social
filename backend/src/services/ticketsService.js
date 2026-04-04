import { Ticket } from '../models/Ticket.js';
import { Event } from '../models/Event.js';
import { generateQRCode } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors.js';

export function getUserTickets(userId) {
  return Ticket.findByUser(userId);
}

export function getTicketById(id, userId) {
  const ticket = Ticket.findById(id);
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.userId !== userId) throw new ForbiddenError('Not authorized to view this ticket');
  return ticket;
}

export function purchaseTicket(eventId, userId, ticketData) {
  const event = Event.findById(eventId);
  if (!event) throw new NotFoundError('Event not found');
  if (event.status !== 'published') throw new BadRequestError('Event is not available for registration');
  if (event.registrationCount >= event.capacity) throw new BadRequestError('Event is at full capacity');

  const existing = Ticket.findByUserAndEvent(userId, eventId);
  if (existing) throw new ConflictError('You are already registered for this event');

  const qrCode = generateQRCode();
  const ticket = Ticket.create({
    eventId,
    userId,
    attendeeName: ticketData.attendeeName,
    attendeeEmail: ticketData.attendeeEmail,
    qrCode,
  });

  Event.incrementRegistrationCount(eventId);
  return ticket;
}

export function cancelTicket(ticketId, userId) {
  const ticket = Ticket.findById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.userId !== userId) throw new ForbiddenError('Not authorized to cancel this ticket');
  if (ticket.status === 'cancelled') throw new BadRequestError('Ticket is already cancelled');

  const cancelled = Ticket.cancel(ticketId);
  Event.decrementRegistrationCount(ticket.eventId);
  return cancelled;
}

export function checkInAttendee(qrCode, organizerId) {
  const ticket = Ticket.findByQRCode(qrCode);
  if (!ticket) throw new NotFoundError('Ticket not found');

  const event = Event.findById(ticket.eventId);
  if (!event) throw new NotFoundError('Event not found');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Not authorized to check in attendees for this event');
  if (ticket.status === 'cancelled') throw new BadRequestError('Ticket has been cancelled');
  if (ticket.checkedIn) throw new BadRequestError('Attendee already checked in');

  return Ticket.checkIn(qrCode);
}
