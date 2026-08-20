import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepo: PaymentsRepository,
    private readonly bookingsRepo: BookingsRepository,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(userId: string, dto: CreatePaymentDto) {
    const booking = await this.bookingsRepo.findById(dto.bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) {
      throw new BadRequestException('You cannot pay for this booking');
    }

    const existing = await this.paymentsRepo.findByBookingId(dto.bookingId);
    if (existing) {
      if (existing.status === PaymentStatus.SUCCESS) {
        throw new BadRequestException('Booking is already paid');
      }

      if (existing.status === PaymentStatus.PENDING) {
        return {
          payment: existing,
          orderId: existing.transactionId ?? `order_stub_${Date.now()}`,
          amount: existing.amount,
          currency: 'INR',
          keyId: this.configService.get<string>('RAZORPAY_KEY') ?? 'rzp_test_stub',
        };
      }
    }

    const razorpayKey = this.configService.get<string>('RAZORPAY_KEY');
    const razorpaySecret = this.configService.get<string>('RAZORPAY_SECRET');

    let orderId: string;
    let providerOrderId: string;

    if (razorpayKey && razorpaySecret) {
      // TODO: real Razorpay SDK call
      // const razorpay = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });
      // const order = await razorpay.orders.create({ amount: booking.totalAmount * 100, currency: 'INR' });
      // orderId = order.id;
      this.logger.log('[DEV] Razorpay SDK would be called here');
      orderId = `order_stub_${Date.now()}`;
      providerOrderId = orderId;
    } else {
      this.logger.warn('[DEV] RAZORPAY_KEY not set — using stub order ID');
      orderId = `order_stub_${Date.now()}`;
      providerOrderId = orderId;
    }

    const payment = await this.paymentsRepo.create({
      bookingId: dto.bookingId,
      amount: booking.totalAmount,
      method: dto.method,
      status: PaymentStatus.PENDING,
      provider: 'razorpay',
      transactionId: providerOrderId,
    });

    return {
      payment,
      orderId,
      amount: booking.totalAmount,
      currency: 'INR',
      keyId: razorpayKey ?? 'rzp_test_stub',
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.paymentsRepo.findByProviderOrderId(dto.razorpayOrderId);

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
      this.logger.warn('[DEV] Skipping Razorpay signature verification — key not set');
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
