import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.refreshToken.findUnique({
      where: { id },
    });
  }

  async findActiveById(id: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async deleteById(id: string) {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async deleteAll(userId: string) {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
