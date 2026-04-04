const { eq, and } = require('drizzle-orm');
const crypto = require('crypto');
const { getDb, tickets, events, users } = require('@ai-event-organiser/database');
const { publishEvent, TOPICS } = require('@ai-event-organiser/kafka');
const { NotFoundError, ForbiddenError, ConflictError } = require('@ai-event-organiser/common');

async function purchaseTicket(req, res, next) {
  try {
    const db = getDb();
    const { eventId } = req.params;
    const { attendeeName, attendeeEmail } = req.body;

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return next(new NotFoundError('Event not found'));

    if (event.registrationCount >= event.capacity) {
      return next(new ConflictError('Event is at full capacity'));
    }

    // Check if user already has a ticket
    const [existing] = await db.select().from(tickets)
      .where(and(eq(tickets.eventId, eventId), eq(tickets.userId, req.user.id), eq(tickets.status, 'confirmed')));
    if (existing) {
      return next(new ConflictError('You already have a ticket for this event'));
    }

    const qrCode = crypto.randomUUID();

    const [ticket] = await db.insert(tickets).values({
      eventId,
      userId: req.user.id,
      attendeeName,
      attendeeEmail,
      qrCode,
    }).returning();

    // Update registration count
    await db.update(events)
      .set({ registrationCount: event.registrationCount + 1, updatedAt: new Date() })
      .where(eq(events.id, eventId));

    // Publish ticket purchased event
    try {
      await publishEvent(TOPICS.TICKET_PURCHASED, ticket.id, {
        ticketId: ticket.id,
        eventId: event.id,
        eventTitle: event.title,
        userId: req.user.id,
        attendeeName,
        attendeeEmail,
        qrCode,
      });
    } catch (kafkaErr) {
      console.error('Failed to publish ticket.purchased:', kafkaErr.message);
    }

    res.status(201).json({ status: 'success', data: { ticket } });
  } catch (err) {
    next(err);
  }
}

async function cancelTicket(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return next(new NotFoundError('Ticket not found'));
    if (ticket.userId !== req.user.id) return next(new ForbiddenError('Not authorized'));
    if (ticket.status === 'cancelled') return next(new ConflictError('Ticket already cancelled'));

    const [updated] = await db.update(tickets)
      .set({ status: 'cancelled' })
      .where(eq(tickets.id, id))
      .returning();

    // Decrement registration count
    const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId));
    if (event && event.registrationCount > 0) {
      await db.update(events)
        .set({ registrationCount: event.registrationCount - 1, updatedAt: new Date() })
        .where(eq(events.id, ticket.eventId));
    }

    try {
      await publishEvent(TOPICS.TICKET_CANCELLED, id, {
        ticketId: id,
        eventId: ticket.eventId,
        userId: ticket.userId,
      });
    } catch (kafkaErr) {
      console.error('Failed to publish ticket.cancelled:', kafkaErr.message);
    }

    res.json({ status: 'success', data: { ticket: updated } });
  } catch (err) {
    next(err);
  }
}

async function getMyTickets(req, res, next) {
  try {
    const db = getDb();
    const myTickets = await db.select({
      ticket: tickets,
      event: events,
    }).from(tickets)
      .leftJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, req.user.id));

    res.json({ status: 'success', data: { tickets: myTickets } });
  } catch (err) {
    next(err);
  }
}

async function getEventTickets(req, res, next) {
  try {
    const db = getDb();
    const { eventId } = req.params;

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return next(new NotFoundError('Event not found'));
    if (event.organizerId !== req.user.id) return next(new ForbiddenError('Not authorized'));

    const eventTickets = await db.select().from(tickets).where(eq(tickets.eventId, eventId));
    res.json({ status: 'success', data: { tickets: eventTickets } });
  } catch (err) {
    next(err);
  }
}

async function checkIn(req, res, next) {
  try {
    const db = getDb();
    const { qrCode } = req.params;

    const [ticket] = await db.select().from(tickets).where(eq(tickets.qrCode, qrCode));
    if (!ticket) return next(new NotFoundError('Ticket not found'));
    if (ticket.status === 'cancelled') return next(new ConflictError('Ticket is cancelled'));
    if (ticket.checkedIn) return next(new ConflictError('Already checked in'));

    const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId));
    if (!event || event.organizerId !== req.user.id) return next(new ForbiddenError('Not authorized'));

    const [updated] = await db.update(tickets)
      .set({ checkedIn: true, checkedInAt: new Date() })
      .where(eq(tickets.id, ticket.id))
      .returning();

    res.json({ status: 'success', data: { ticket: updated } });
  } catch (err) {
    next(err);
  }
}

module.exports = { purchaseTicket, cancelTicket, getMyTickets, getEventTickets, checkIn };
