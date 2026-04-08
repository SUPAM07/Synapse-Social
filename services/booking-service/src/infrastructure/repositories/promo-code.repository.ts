import prisma from '../database/prisma';
import { PromoCodeEntity } from '../../domain/entities/promo-code.entity';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from '../../application/dto/promo-code.dto';

export class PromoCodeRepository {
  async findById(id: string): Promise<PromoCodeEntity | null> {
    return prisma.promoCode.findUnique({ where: { id } }) as Promise<PromoCodeEntity | null>;
  }

  async findByCode(promoCode: string): Promise<PromoCodeEntity | null> {
    return prisma.promoCode.findUnique({ where: { promoCode } }) as Promise<PromoCodeEntity | null>;
  }

  async findByCodeAndEvent(promoCode: string, eventId: string): Promise<PromoCodeEntity | null> {
    return prisma.promoCode.findFirst({ where: { promoCode, eventId } }) as Promise<PromoCodeEntity | null>;
  }

  async findByEventId(eventId: string): Promise<PromoCodeEntity[]> {
    return prisma.promoCode.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' } }) as Promise<PromoCodeEntity[]>;
  }

  async create(data: CreatePromoCodeDto): Promise<PromoCodeEntity> {
    return prisma.promoCode.create({ data }) as Promise<PromoCodeEntity>;
  }

  async update(id: string, data: UpdatePromoCodeDto): Promise<PromoCodeEntity> {
    return prisma.promoCode.update({ where: { id }, data }) as Promise<PromoCodeEntity>;
  }

  async delete(id: string): Promise<void> {
    await prisma.promoCode.delete({ where: { id } });
  }
}
