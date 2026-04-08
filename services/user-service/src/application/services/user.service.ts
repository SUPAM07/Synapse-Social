import {
  UserRepository,
  CompanyRepository,
  SubscriptionRepository,
} from '../../infrastructure/repositories/user.repository';
import { kafkaPublisher } from '../../infrastructure/messaging/kafka.publisher';
import { NotFoundError, ForbiddenError, ValidationError } from '@uevent/utils';
import { createLogger } from '@uevent/utils';
import { UpdateUserDto, CreateCompanyDto, UpdateCompanyDto } from '../dto/user.dto';

const logger = createLogger('user-service');

export class UserService {
  private userRepo = new UserRepository();
  private companyRepo = new CompanyRepository();
  private subscriptionRepo = new SubscriptionRepository();

  async getUser(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateUser(id: string, requesterId: string, dto: UpdateUserDto) {
    if (id !== requesterId) throw new ForbiddenError();
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');

    const updated = await this.userRepo.update(id, dto);

    try {
      await kafkaPublisher.publishUserUpdated({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        userId: id,
        fullName: dto.fullName,
        picturePath: dto.picturePath,
      });
    } catch (err) {
      logger.warn('Failed to publish UserUpdated', { err });
    }

    return updated;
  }

  async deleteUser(id: string, requesterId: string, requesterRole: string) {
    if (id !== requesterId && requesterRole !== 'admin') throw new ForbiddenError();
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');

    await this.userRepo.delete(id);

    try {
      await kafkaPublisher.publishUserDeleted({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        userId: id,
      });
    } catch (err) {
      logger.warn('Failed to publish UserDeleted', { err });
    }
  }

  async getUserCompanies(userId: string) {
    return this.companyRepo.findByOwnerId(userId);
  }

  async createCompany(ownerId: string, dto: CreateCompanyDto) {
    return this.companyRepo.create({ ...dto, ownerId });
  }

  async updateCompany(companyId: string, ownerId: string, dto: UpdateCompanyDto) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new NotFoundError('Company');
    if (company.ownerId !== ownerId) throw new ForbiddenError();
    return this.companyRepo.update(companyId, dto);
  }

  async deleteCompany(companyId: string, ownerId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new NotFoundError('Company');
    if (company.ownerId !== ownerId) throw new ForbiddenError();
    await this.companyRepo.delete(companyId);
  }

  async subscribeToCompany(userId: string, companyId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) throw new NotFoundError('Company');
    const already = await this.subscriptionRepo.isSubscribed(userId, companyId);
    if (already) throw new ValidationError('Already subscribed');
    return this.subscriptionRepo.subscribe(userId, companyId);
  }

  async unsubscribeFromCompany(userId: string, companyId: string) {
    await this.subscriptionRepo.unsubscribe(userId, companyId);
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionRepo.findByUserId(userId);
  }
}

export const userService = new UserService();
