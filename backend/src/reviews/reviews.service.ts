import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepo: ReviewsRepository,
    private readonly bookingsRepo: BookingsRepository,
  ) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const booking = await this.bookingsRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('Only the customer can review this booking');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ForbiddenException('Can only review completed bookings');
    }

    const existing = await this.reviewsRepo.existsForBooking(dto.bookingId);
    if (existing) {
      throw new ConflictException('Review already submitted for this booking');
    }

    const review = await this.reviewsRepo.create({
      bookingId: dto.bookingId,
      customerId,
      helperId: booking.helperId,
      rating: dto.rating,
      comment: dto.comment,
    });

    // Recalculate helper's average rating
    await this.reviewsRepo.updateHelperRating(booking.helperId);

    return review;
  }

  async findByHelper(helperId: string) {
    return this.reviewsRepo.findByHelper(helperId);
  }
}
