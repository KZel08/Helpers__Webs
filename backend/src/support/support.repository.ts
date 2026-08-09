import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class SupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; title: string; message: string; priority?: TicketPriority }) {
    return this.prisma.supportTicket.create({ data });
  }

  async findByUser(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params: { page: number; limit: number; status?: TicketStatus }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.status ? { status: params.status } : {};
    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({ where, skip, take: params.limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true, email: true } } } }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { tickets, total };
  }

  async update(id: string, data: Partial<{ status: TicketStatus }>) {
    return this.prisma.supportTicket.update({ where: { id }, data });
  }
}
