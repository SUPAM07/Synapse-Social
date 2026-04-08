import {
  EventRepository, FormatRepository, ThemeRepository, CommentRepository,
} from '../../infrastructure/repositories/event.repository';
import { kafkaPublisher } from '../../infrastructure/messaging/kafka.publisher';
import { NotFoundError, ForbiddenError } from '@uevent/utils';
import { createLogger } from '@uevent/utils';
import { CreateEventDto, UpdateEventDto, EventQueryDto, CreateCommentDto } from '../dto/event.dto';

const logger = createLogger('event-service');
const eventRepo = new EventRepository();
const formatRepo = new FormatRepository();
const themeRepo = new ThemeRepository();
const commentRepo = new CommentRepository();

export class EventService {
  async getEvents(query: EventQueryDto) {
    return eventRepo.findMany(query);
  }

  async getEvent(id: string) {
    const event = await eventRepo.findById(id);
    if (!event) throw new NotFoundError('Event');
    return event;
  }

  async createEvent(organizerId: string, dto: CreateEventDto) {
    const event = await eventRepo.create({
      ...dto,
      organizerId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      price: dto.price ?? 0,
      isPublished: false,
    });

    try {
      await kafkaPublisher.publishEventCreated({
        messageId: crypto.randomUUID(),
        eventId: event.id,
        timestamp: new Date().toISOString(),
        version: 1,
        title: event.title,
        organizerId: event.organizerId,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        location: event.location,
        price: event.price,
        capacity: event.capacity,
      });
    } catch (err) {
      logger.warn('Failed to publish EventCreated', { err });
    }

    return event;
  }

  async updateEvent(id: string, requesterId: string, requesterRole: string, dto: UpdateEventDto) {
    const event = await eventRepo.findById(id);
    if (!event) throw new NotFoundError('Event');
    if (event.organizerId !== requesterId && requesterRole !== 'admin') throw new ForbiddenError();

    const updated = await eventRepo.update(id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    try {
      await kafkaPublisher.publishEventUpdated({
        messageId: crypto.randomUUID(),
        eventId: id,
        timestamp: new Date().toISOString(),
        version: 1,
        title: dto.title,
        startDate: dto.startDate,
        endDate: dto.endDate,
        location: dto.location,
        price: dto.price,
        capacity: dto.capacity,
      });
    } catch (err) {
      logger.warn('Failed to publish EventUpdated', { err });
    }

    return updated;
  }

  async deleteEvent(id: string, requesterId: string, requesterRole: string) {
    const event = await eventRepo.findById(id);
    if (!event) throw new NotFoundError('Event');
    if (event.organizerId !== requesterId && requesterRole !== 'admin') throw new ForbiddenError();

    await eventRepo.delete(id);

    try {
      await kafkaPublisher.publishEventDeleted({
        messageId: crypto.randomUUID(),
        eventId: id,
        timestamp: new Date().toISOString(),
        version: 1,
      });
    } catch (err) {
      logger.warn('Failed to publish EventDeleted', { err });
    }
  }

  async getFormats() { return formatRepo.findAll(); }
  async createFormat(name: string) { return formatRepo.create(name); }
  async deleteFormat(id: string) { return formatRepo.delete(id); }

  async getThemes() { return themeRepo.findAll(); }
  async createTheme(name: string) { return themeRepo.create(name); }
  async deleteTheme(id: string) { return themeRepo.delete(id); }

  async getComments(eventId: string) { return commentRepo.findByEventId(eventId); }

  async createComment(userId: string, eventId: string, dto: CreateCommentDto) {
    const event = await eventRepo.findById(eventId);
    if (!event) throw new NotFoundError('Event');
    return commentRepo.create(userId, eventId, dto.content);
  }

  async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await commentRepo.findById(commentId);
    if (!comment) throw new NotFoundError('Comment');
    if (comment.userId !== userId && userRole !== 'admin') throw new ForbiddenError();
    await commentRepo.delete(commentId);
  }
}

export const eventService = new EventService();
