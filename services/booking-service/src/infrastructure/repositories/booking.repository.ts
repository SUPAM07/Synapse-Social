import prisma from '../database/prisma';
import { BookingEntity, BookingStatus } from '../../domain/entities/booking.entity';
import { BookingQueryDto } from '../../application/dto/booking.dto';

export class BookingRepository {
  async findMany(query: BookingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.eventId) where.eventId = query.eventId;
    if (query.status) where.status = query.status;
    const [items, total] = await Promise.all([
      prisma.booking.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.booking.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<BookingEntity | null> {
    return prisma.booking.findUnique({ where: { id } }) as Promise<BookingEntity | null>;
  }

  async create(data: Omit<BookingEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookingEntity> {
    return prisma.booking.create({ data }) as Promise<BookingEntity>;
  }

  async updateStatus(id: string, status: BookingStatus, paymentId?: string): Promise<BookingEntity> {
    return prisma.booking.update({
      where: { id },
      data: { status, ...(paymentId ? { paymentId } : {}) },
    }) as Promise<BookingEntity>;
  }

  async delete(id: string): Promise<void> {
    await prisma.booking.delete({ where: { id } });
  }
}
