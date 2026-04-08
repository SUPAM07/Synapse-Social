import { PromoCodeRepository } from '../../infrastructure/repositories/promo-code.repository';
import { NotFoundError, ValidationError } from '@uevent/utils';
import { PromoCodeEntity, validateDiscount } from '../../domain/entities/promo-code.entity';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from '../dto/promo-code.dto';

const promoCodeRepo = new PromoCodeRepository();

export class PromoCodeService {
  async getPromoCodeById(id: string): Promise<PromoCodeEntity> {
    const promoCode = await promoCodeRepo.findById(id);
    if (!promoCode) throw new NotFoundError('PromoCode');
    return promoCode;
  }

  async getPromoCodesByEvent(eventId: string): Promise<PromoCodeEntity[]> {
    return promoCodeRepo.findByEventId(eventId);
  }

  async validatePromoCode(code: string, eventId: string): Promise<PromoCodeEntity | null> {
    return promoCodeRepo.findByCodeAndEvent(code, eventId);
  }

  async createPromoCode(dto: CreatePromoCodeDto): Promise<PromoCodeEntity> {
    if (!validateDiscount(dto.discount)) {
      throw new ValidationError('Discount must be an integer between 0 and 100');
    }
    const existing = await promoCodeRepo.findByCode(dto.promoCode);
    if (existing) {
      throw new ValidationError('Promo code already exists');
    }
    return promoCodeRepo.create(dto);
  }

  async updatePromoCode(id: string, dto: UpdatePromoCodeDto): Promise<PromoCodeEntity> {
    const promoCode = await promoCodeRepo.findById(id);
    if (!promoCode) throw new NotFoundError('PromoCode');

    if (dto.discount !== undefined && !validateDiscount(dto.discount)) {
      throw new ValidationError('Discount must be an integer between 0 and 100');
    }
    if (dto.promoCode !== undefined && dto.promoCode !== promoCode.promoCode) {
      const existing = await promoCodeRepo.findByCode(dto.promoCode);
      if (existing) {
        throw new ValidationError('Promo code already exists');
      }
    }
    return promoCodeRepo.update(id, dto);
  }

  async deletePromoCode(id: string): Promise<void> {
    const promoCode = await promoCodeRepo.findById(id);
    if (!promoCode) throw new NotFoundError('PromoCode');
    await promoCodeRepo.delete(id);
  }
}

export const promoCodeService = new PromoCodeService();
