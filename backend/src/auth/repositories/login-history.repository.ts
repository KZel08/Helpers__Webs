import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class LoginHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LoginHistoryUncheckedCreateInput) {
    return this.prisma.loginHistory.create({ data });
  }

  async getUserHistory(userId: string) {
    return this.prisma.loginHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async deleteOldLogs(userId: string, olderThan: Date) {
    return this.prisma.loginHistory.deleteMany({ where: { userId, createdAt: { lt: olderThan } } });
  }
}
