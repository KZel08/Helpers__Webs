import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [PrismaModule, AuthModule, BookingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
