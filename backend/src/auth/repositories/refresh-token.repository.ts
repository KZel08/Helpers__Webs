import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return this.prisma.refreshToken.create({ data });
  }

  async deleteCurrent(userId: string) {
    return this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteAll(userId: string) {
    return this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async findValidToken(hashedToken: string) {
    return this.prisma.refreshToken.findFirst({
      where: { hashedToken, expiresAt: { gt: new Date() } },
    });
  }

  async rotate(id: string, data: Prisma.RefreshTokenUpdateInput) {
    return this.prisma.refreshToken.update({ where: { id }, data });
  }
}
