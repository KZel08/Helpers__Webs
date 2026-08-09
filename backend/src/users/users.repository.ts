import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { addresses: true },
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
}
