import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    bookingId: string;
    customerId: string;
    helperId: string;
    rating: number;
    comment?: string;
  }) {
    return this.prisma.review.create({
      data,
      include: {
        customer: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async findByHelper(helperId: string) {
    return this.prisma.review.findMany({
      where: { helperId },
      include: {
        customer: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsForBooking(bookingId: string) {
    return this.prisma.review.findUnique({ where: { bookingId } });
  }

  async updateHelperRating(helperId: string) {
    const result = await this.prisma.review.aggregate({
      where: { helperId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.helperProfile.update({
      where: { id: helperId },
      data: {
        rating: result._avg.rating ?? 0,
        totalReviews: result._count.rating,
      },
    });
  }
}
