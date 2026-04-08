import { UserEntity, CompanyEntity } from '../../domain/entities/user.entity';
import prisma from '../database/prisma';

export class UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return prisma.user.update({ where: { id }, data }) as Promise<UserEntity>;
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async upsert(data: Omit<UserEntity, 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    return prisma.user.upsert({
      where: { id: data.id },
      update: { login: data.login, email: data.email, fullName: data.fullName },
      create: data,
    }) as Promise<UserEntity>;
  }
}

export class CompanyRepository {
  async findById(id: string): Promise<CompanyEntity | null> {
    return prisma.company.findUnique({ where: { id } }) as Promise<CompanyEntity | null>;
  }

  async findByOwnerId(ownerId: string): Promise<CompanyEntity[]> {
    return prisma.company.findMany({ where: { ownerId } }) as Promise<CompanyEntity[]>;
  }

  async create(data: Omit<CompanyEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyEntity> {
    return prisma.company.create({ data }) as Promise<CompanyEntity>;
  }

  async update(id: string, data: Partial<CompanyEntity>): Promise<CompanyEntity> {
    return prisma.company.update({ where: { id }, data }) as Promise<CompanyEntity>;
  }

  async delete(id: string): Promise<void> {
    await prisma.company.delete({ where: { id } });
  }
}

export class SubscriptionRepository {
  async findByUserId(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: { company: true },
    });
  }

  async subscribe(userId: string, companyId: string) {
    return prisma.subscription.create({ data: { userId, companyId } });
  }

  async unsubscribe(userId: string, companyId: string) {
    await prisma.subscription.deleteMany({ where: { userId, companyId } });
  }

  async isSubscribed(userId: string, companyId: string): Promise<boolean> {
    const sub = await prisma.subscription.findFirst({ where: { userId, companyId } });
    return sub !== null;
  }
}
