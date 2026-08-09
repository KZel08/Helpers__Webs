import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }

  async findByBookingId(bookingId: string) {
    return this.prisma.payment.findUnique({ where: { bookingId } });
  }

  async findByUser(customerId: string) {
    return this.prisma.payment.findMany({
      where: { booking: { customerId } },
      include: {
        booking: {
          include: {
            service: true,
            helper: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async findAll(params: { page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: { booking: true },
      }),
      this.prisma.payment.count(),
    ]);
    return { payments, total };
  }
}
