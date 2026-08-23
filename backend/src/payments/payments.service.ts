import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepo: PaymentsRepository,
    private readonly bookingsRepo: BookingsRepository,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(userId: string, dto: CreatePaymentDto) {
    // Read credentials first — needed by both the idempotency path and the new-order path.
    const razorpayKey = this.configService.get<string>('RAZORPAY_KEY');
    const razorpaySecret = this.configService.get<string>('RAZORPAY_SECRET');

    if (!razorpayKey || !razorpaySecret) {
      throw new BadRequestException(
        'Razorpay payment configuration is unavailable',
      );
    }

    const booking = await this.bookingsRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) {
      throw new BadRequestException('You cannot pay for this booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot create payment for a cancelled booking',
      );
    }

    const existing = await this.paymentsRepo.findByBookingId(dto.bookingId);
    if (existing) {
      if (existing.status === PaymentStatus.SUCCESS) {
        throw new BadRequestException('Booking is already paid');
      }

      if (existing.status === PaymentStatus.PENDING) {
        if (!existing.transactionId) {
          throw new BadRequestException(
            'Existing payment is missing its Razorpay order ID',
          );
        }

        return {
          payment: existing,
          orderId: existing.transactionId,
          amount: existing.amount,
          currency: 'INR',
          keyId: razorpayKey,
        };
      }
    }

    // Create a real Razorpay order. Do NOT persist the local Payment record
    // until the SDK call succeeds, so a failed order leaves no orphan record.
    const razorpay = new Razorpay({
      key_id: razorpayKey,
      key_secret: razorpaySecret,
    });

    const order = await razorpay.orders.create({
      amount: booking.totalAmount * 100,
      currency: 'INR',
      receipt: booking.id,
    });

    const payment = await this.paymentsRepo.create({
      bookingId: dto.bookingId,
      amount: booking.totalAmount,
      method: dto.method,
      status: PaymentStatus.PENDING,
      provider: 'razorpay',
      transactionId: order.id,
    });

    return {
      payment,
      orderId: order.id,
      amount: booking.totalAmount,
      currency: 'INR',
      keyId: razorpayKey,
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.paymentsRepo.findByProviderOrderId(
      dto.razorpayOrderId,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found for this Razorpay order');
    }

    if (payment.booking.customerId !== userId) {
      throw new ForbiddenException('You do not own this payment');
    }

    const razorpaySecret = this.configService.get<string>('RAZORPAY_SECRET');

    if (razorpaySecret) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== dto.razorpaySignature) {
        throw new BadRequestException('Payment signature verification failed');
      }
    } else {
      this.logger.warn(
        '[DEV] Skipping Razorpay signature verification — key not set',
      );
    }

    const updated = await this.paymentsRepo.update(payment.id, {
      status: PaymentStatus.SUCCESS,
      paidAt: new Date(),
    });

    return { message: 'Payment verified successfully', payment: updated };
  }

  async getHistory(userId: string) {
    return this.paymentsRepo.findByUser(userId);
  }
}
