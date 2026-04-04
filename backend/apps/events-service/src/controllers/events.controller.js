const { eq, desc, like, and, sql } = require('drizzle-orm');
const { getDb, events, users } = require('@ai-event-organiser/database');
const { publishEvent, TOPICS } = require('@ai-event-organiser/kafka');
const { NotFoundError, ForbiddenError } = require('@ai-event-organiser/common');

function generateSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${Date.now()}`;
}

async function listEvents(req, res, next) {
  try {
    const db = getDb();
    const { category, city, country, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [eq(events.isPublished, true)];
    if (category) conditions.push(eq(events.category, category));
    if (city) conditions.push(eq(events.city, city));
    if (country) conditions.push(eq(events.country, country));
    if (search) conditions.push(like(events.title, `%${search}%`));

    const results = await db.select().from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startDate))
      .limit(parseInt(limit))
      .offset(offset);

    res.json({ status: 'success', data: { events: results } });
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return next(new NotFoundError('Event not found'));

    res.json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}

async function getEventBySlug(req, res, next) {
  try {
    const db = getDb();
    const { slug } = req.params;

    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    if (!event) return next(new NotFoundError('Event not found'));

    res.json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const db = getDb();
    const {
      title, description, category, tags, startDate, endDate, timezone,
      locationType, venue, address, city, state, country, capacity,
      ticketType, ticketPrice, coverImage, themeColor,
    } = req.body;

    // Check free event limit
    const [organizer] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!organizer) return next(new NotFoundError('User not found'));

    if (organizer.role !== 'organizer' && organizer.freeEventsCreated >= 1) {
      return next(new ForbiddenError('Free event limit reached. Please upgrade to Pro.'));
    }

    const slug = generateSlug(title);

    const [event] = await db.insert(events).values({
      title, description, slug, category, tags: tags || [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone, locationType, venue, address, city, state, country,
      capacity, ticketType, ticketPrice,
      coverImage, themeColor: themeColor || '#1e3a8a',
      organizerId: req.user.id,
      organizerName: organizer.name,
    }).returning();

    // Update free events counter
    if (organizer.role !== 'organizer') {
      await db.update(users)
        .set({ freeEventsCreated: organizer.freeEventsCreated + 1, updatedAt: new Date() })
        .where(eq(users.id, req.user.id));
    }

    // Publish event created Kafka event
    try {
      await publishEvent(TOPICS.EVENT_CREATED, event.id, {
        eventId: event.id,
        title: event.title,
        organizerId: event.organizerId,
        capacity: event.capacity,
        ticketType: event.ticketType,
      });
    } catch (kafkaErr) {
      console.error('Failed to publish event.created:', kafkaErr.message);
    }

    res.status(201).json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return next(new NotFoundError('Event not found'));
    if (event.organizerId !== req.user.id) return next(new ForbiddenError('Not authorized to update this event'));

    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    res.json({ status: 'success', data: { event: updated } });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return next(new NotFoundError('Event not found'));
    if (event.organizerId !== req.user.id) return next(new ForbiddenError('Not authorized to delete this event'));

    await db.delete(events).where(eq(events.id, id));
    res.json({ status: 'success', message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

async function togglePublish(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return next(new NotFoundError('Event not found'));
    if (event.organizerId !== req.user.id) return next(new ForbiddenError('Not authorized'));

    const [updated] = await db.update(events)
      .set({ isPublished: !event.isPublished, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();

    res.json({ status: 'success', data: { event: updated } });
  } catch (err) {
    next(err);
  }
}

async function getMyEvents(req, res, next) {
  try {
    const db = getDb();
    const results = await db.select().from(events)
      .where(eq(events.organizerId, req.user.id))
      .orderBy(desc(events.createdAt));

    res.json({ status: 'success', data: { events: results } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, getEvent, getEventBySlug, createEvent, updateEvent, deleteEvent, togglePublish, getMyEvents };
