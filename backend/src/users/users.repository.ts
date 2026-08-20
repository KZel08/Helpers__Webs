import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { addresses: true, helperProfile: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        addresses: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findAll(params: { page: number; limit: number; role?: Role }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.role ? { role: params.role, deletedAt: null } : { deletedAt: null };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take: params.limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total };
  }

  // ─── Address operations ─────────────────────────────────────────────────

  async findAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAddressById(id: string) {
    return this.prisma.address.findUnique({ where: { id } });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async updateAddress(id: string, dto: UpdateAddressDto) {
    return this.prisma.address.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAddress(id: string) {
    return this.prisma.address.delete({ where: { id } });
  }

  async clearDefaultAddresses(userId: string, tx?: any) {
    const prisma = tx ?? this.prisma;
    return prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
