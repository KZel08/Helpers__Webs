import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, PaymentStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepo: {
    findByBookingId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findByProviderOrderId: jest.Mock;
    findByUser: jest.Mock;
  };
  let bookingsRepo: { findById: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentsRepository,
          useValue: {
            findByBookingId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findByProviderOrderId: jest.fn(),
            findByUser: jest.fn(),
          },
        },
        { provide: BookingsRepository, useValue: { findById: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentsRepo = module.get(PaymentsRepository);
    bookingsRepo = module.get(BookingsRepository);
    configService = module.get(ConfigService);
  });

  const customerId = 'customer-1';
  const bookingId = 'booking-1';
  const dto = { bookingId, method: 'CARD' as const };

  const pendingBooking = {
    id: bookingId,
    customerId,
    totalAmount: 599,
    status: BookingStatus.PENDING,
  };

  beforeEach(() => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RAZORPAY_KEY') return null;
      if (key === 'RAZORPAY_SECRET') return null;
      return undefined;
    });
  });

  describe('createOrder', () => {
    it('should create a payment order for a PENDING booking', async () => {
      bookingsRepo.findById.mockResolvedValue(pendingBooking);
      paymentsRepo.findByBookingId.mockResolvedValue(null);
      paymentsRepo.create.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        amount: 599,
        method: 'CARD',
        status: PaymentStatus.PENDING,
      });

      const result = await service.createOrder(customerId, dto);

      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('amount', 599);
      expect(result).toHaveProperty('currency', 'INR');
      expect(paymentsRepo.create).toHaveBeenCalled();
    });

    it('should reject payment creation for a CANCELLED booking', async () => {
      const cancelledBooking = { ...pendingBooking, status: BookingStatus.CANCELLED };
      bookingsRepo.findById.mockResolvedValue(cancelledBooking);

      await expect(service.createOrder(customerId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(customerId, dto)).rejects.toThrow(
        'Cannot create payment for a cancelled booking',
      );
    });

    it('should reject payment creation for an already-paid booking', async () => {
      bookingsRepo.findById.mockResolvedValue(pendingBooking);
      paymentsRepo.findByBookingId.mockResolvedValue({
        id: 'existing-payment',
        bookingId,
        status: PaymentStatus.SUCCESS,
      });

      await expect(service.createOrder(customerId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(customerId, dto)).rejects.toThrow('Booking is already paid');
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      bookingsRepo.findById.mockResolvedValue(null);

      await expect(service.createOrder(customerId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking does not belong to the user', async () => {
      const otherBooking = { ...pendingBooking, customerId: 'other-user' };
      bookingsRepo.findById.mockResolvedValue(otherBooking);

      await expect(service.createOrder(customerId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(customerId, dto)).rejects.toThrow(
        'You cannot pay for this booking',
      );
    });
  });
});
