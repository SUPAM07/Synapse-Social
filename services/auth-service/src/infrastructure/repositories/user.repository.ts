import { UserEntity } from '../../domain/entities/user.entity';
import prisma from '../database/prisma';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByLogin(login: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>;
  }

  async findByLogin(login: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { login } }) as Promise<UserEntity | null>;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<UserEntity | null>;
  }

  async create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    return prisma.user.create({ data }) as Promise<UserEntity>;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return prisma.user.update({ where: { id }, data }) as Promise<UserEntity>;
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
