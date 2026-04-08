import prisma from '../database/prisma';
import { PaymentEntity, PaymentStatus } from '../../domain/entities/payment.entity';

export class PaymentRepository {
  async findById(id: string): Promise<PaymentEntity | null> {
    return prisma.payment.findUnique({ where: { id } }) as Promise<PaymentEntity | null>;
  }

  async findByBookingId(bookingId: string): Promise<PaymentEntity | null> {
    return prisma.payment.findUnique({ where: { bookingId } }) as Promise<PaymentEntity | null>;
  }

  async create(data: Omit<PaymentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentEntity> {
    return prisma.payment.create({ data }) as Promise<PaymentEntity>;
  }

  async update(id: string, data: Partial<PaymentEntity>): Promise<PaymentEntity> {
    return prisma.payment.update({ where: { id }, data }) as Promise<PaymentEntity>;
  }
}
