import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private readonly bookingsRepo: BookingsRepository) {}

  async create(customerId: string, dto: CreateBookingDto) {
    return this.bookingsRepo.create(customerId, dto);
  }

  async findMyBookings(userId: string, role: 'customer' | 'helper') {
    return this.bookingsRepo.findByUser(userId, role);
  }

  async findById(id: string) {
    const booking = await this.bookingsRepo.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(userId: string, bookingId: string, dto: UpdateBookingDto) {
    const booking = await this.findById(bookingId);

    const isCustomer = booking.customerId === userId;
    const isHelper = booking.helperId === userId;

    if (!isCustomer && !isHelper) {
      throw new ForbiddenException('You are not part of this booking');
    }

    if (dto.status !== undefined) {
      if (dto.status === BookingStatus.CANCELLED && !isCustomer) {
        throw new ForbiddenException('Only the customer can cancel a booking');
      }

      if (
        (dto.status === BookingStatus.ACCEPTED ||
          dto.status === BookingStatus.ONGOING ||
          dto.status === BookingStatus.COMPLETED) &&
        !isHelper
      ) {
        throw new ForbiddenException(
          'Only the helper can update the booking to this status',
        );
      }
    }

    return this.bookingsRepo.update(bookingId, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
  }

  async cancel(userId: string, bookingId: string) {
    const booking = await this.findById(bookingId);
    if (booking.customerId !== userId) {
      throw new ForbiddenException('Only the customer can cancel a booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new ForbiddenException('Only pending bookings can be cancelled');
    }
    return this.bookingsRepo.softDelete(bookingId);
  }
}
