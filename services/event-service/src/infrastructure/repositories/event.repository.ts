import prisma from '../database/prisma';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventQueryDto } from '../../application/dto/event.dto';

export class EventRepository {
  async findMany(query: EventQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};
    if (query.formatId) where.formatId = query.formatId;
    if (query.themeId) where.themeId = query.themeId;
    if (query.organizerId) where.organizerId = query.organizerId;
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { format: true, theme: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string) {
    return prisma.event.findUnique({ where: { id }, include: { format: true, theme: true, comments: true } });
  }

  async create(data: Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.event.create({ data });
  }

  async update(id: string, data: Partial<EventEntity>) {
    return prisma.event.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.event.delete({ where: { id } });
  }
}

export class FormatRepository {
  async findAll() { return prisma.eventFormat.findMany(); }
  async create(name: string) { return prisma.eventFormat.create({ data: { name } }); }
  async delete(id: string) { await prisma.eventFormat.delete({ where: { id } }); }
}

export class ThemeRepository {
  async findAll() { return prisma.eventTheme.findMany(); }
  async create(name: string) { return prisma.eventTheme.create({ data: { name } }); }
  async delete(id: string) { await prisma.eventTheme.delete({ where: { id } }); }
}

export class CommentRepository {
  async findByEventId(eventId: string) {
    return prisma.comment.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' } });
  }
  async create(userId: string, eventId: string, content: string) {
    return prisma.comment.create({ data: { userId, eventId, content } });
  }
  async delete(id: string) { await prisma.comment.delete({ where: { id } }); }
  async findById(id: string) { return prisma.comment.findUnique({ where: { id } }); }
}
