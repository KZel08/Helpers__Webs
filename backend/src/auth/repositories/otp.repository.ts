import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class OTPRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OtpUncheckedCreateInput) {
    return this.prisma.otp.create({ data });
  }

  async findOtp(userId: string, purpose: string) {
    return this.prisma.otp.findFirst({ where: { userId, purpose, used: false } });
  }

  async markUsed(id: string) {
    return this.prisma.otp.update({ where: { id }, data: { used: true } });
  }

  async deleteExpired() {
    return this.prisma.otp.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}
