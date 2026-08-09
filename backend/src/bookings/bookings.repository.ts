import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: {
        customerId,
        helperId: dto.helperId,
        serviceId: dto.serviceId,
        addressId: dto.addressId,
        bookingDate: new Date(dto.bookingDate),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        notes: dto.notes,
        totalAmount: dto.totalAmount,
        status: BookingStatus.PENDING,
      },
      include: {
        service: true,
        helper: { include: { user: { select: { firstName: true, lastName: true } } } },
        address: true,
      },
    });
  }

  async findByUser(userId: string, role: 'customer' | 'helper') {
    const where = role === 'customer' ? { customerId: userId } : { helperId: userId };
    return this.prisma.booking.findMany({
      where: { ...where, deletedAt: null },
      include: {
        service: { include: { category: true } },
        helper: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        helper: { include: { user: { select: { firstName: true, lastName: true } } } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        address: true,
        payment: true,
        review: true,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.booking.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date(), status: BookingStatus.CANCELLED },
    });
  }

  async findAll(params: { page: number; limit: number; status?: BookingStatus }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.status ? { status: params.status, deletedAt: null } : { deletedAt: null };
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({ where, skip, take: params.limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.booking.count({ where }),
    ]);
    return { bookings, total };
  }
}
