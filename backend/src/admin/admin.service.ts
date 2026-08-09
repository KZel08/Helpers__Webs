import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalUsers, totalHelpers, totalBookings, totalRevenue, pendingVerifications] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.helperProfile.count(),
        this.prisma.booking.count({ where: { deletedAt: null } }),
        this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
        this.prisma.helperProfile.count({ where: { verificationStatus: 'PENDING' } }),
      ]);

    return {
      totalUsers,
      totalHelpers,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      pendingVerifications,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return { users, total, page, limit };
  }

  async getBookings(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        include: {
          service: { select: { title: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
          helper: { include: { user: { select: { firstName: true, lastName: true } } } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where: { deletedAt: null } }),
    ]);
    return { bookings, total, page, limit };
  }

  async getTickets(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        skip,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count(),
    ]);
    return { tickets, total, page, limit };
  }

  async verifyHelper(helperId: string, approved: boolean) {
    return this.prisma.helperProfile.update({
      where: { id: helperId },
      data: { verificationStatus: approved ? 'VERIFIED' : 'REJECTED' },
    });
  }
}
