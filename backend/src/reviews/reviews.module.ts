import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [PrismaModule, AuthModule, BookingsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService],
})
export class ReviewsModule {}
