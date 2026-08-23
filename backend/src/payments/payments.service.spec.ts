import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '../bookings/bookings.repository';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, PaymentStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Razorpay SDK mock — must be declared BEFORE the import so Jest hoists it.
// ---------------------------------------------------------------------------

const mockOrdersCreate = jest.fn();

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: { create: mockOrdersCreate },
  }));
});

// Re-import AFTER mock registration so the module picks up the mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MockRazorpayConstructor = require('razorpay') as jest.Mock;

// ---------------------------------------------------------------------------

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Shared fixtures
  const customerId = 'customer-1';
  const bookingId = 'booking-1';
  const dto = { bookingId, method: 'CARD' as const };

  const pendingBooking = {
    id: bookingId,
    customerId,
    totalAmount: 599,
    status: BookingStatus.PENDING,
  };

  const razorpayOrderId = 'order_abc123';
  const razorpayOrder = { id: razorpayOrderId };

  /** Configures configService to return real-looking credentials. */
  function withCredentials() {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RAZORPAY_KEY') return 'rzp_test_key';
      if (key === 'RAZORPAY_SECRET') return 'rzp_test_secret';
      return undefined;
    });
  }

  /** Configures configService to return no credentials (both null). */
  function withoutCredentials() {
    configService.get.mockImplementation((key: string) => {
      if (key === 'RAZORPAY_KEY') return null;
      if (key === 'RAZORPAY_SECRET') return null;
      return undefined;
    });
  }

  // ─── createOrder ──────────────────────────────────────────────────────────

  describe('createOrder', () => {
    describe('credential checks', () => {
      it('throws BadRequestException when RAZORPAY_KEY is missing', async () => {
        configService.get.mockImplementation((key: string) => {
          if (key === 'RAZORPAY_KEY') return null;
          if (key === 'RAZORPAY_SECRET') return 'rzp_test_secret';
          return undefined;
        });

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Razorpay payment configuration is unavailable',
        );
        expect(paymentsRepo.create).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when RAZORPAY_SECRET is missing', async () => {
        configService.get.mockImplementation((key: string) => {
          if (key === 'RAZORPAY_KEY') return 'rzp_test_key';
          if (key === 'RAZORPAY_SECRET') return null;
          return undefined;
        });

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Razorpay payment configuration is unavailable',
        );
        expect(paymentsRepo.create).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when both credentials are missing', async () => {
        withoutCredentials();
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Razorpay payment configuration is unavailable',
        );
      });
    });

    describe('booking ownership / status checks (require credentials)', () => {
      beforeEach(withCredentials);

      it('throws NotFoundException if booking does not exist', async () => {
        bookingsRepo.findById.mockResolvedValue(null);
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws BadRequestException if booking does not belong to the user', async () => {
        const otherBooking = { ...pendingBooking, customerId: 'other-user' };
        bookingsRepo.findById.mockResolvedValue(otherBooking);

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'You cannot pay for this booking',
        );
      });

      it('throws BadRequestException for a CANCELLED booking', async () => {
        const cancelledBooking = {
          ...pendingBooking,
          status: BookingStatus.CANCELLED,
        };
        bookingsRepo.findById.mockResolvedValue(cancelledBooking);

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Cannot create payment for a cancelled booking',
        );
      });
    });

    describe('existing payment idempotency (require credentials)', () => {
      beforeEach(withCredentials);

      it('throws BadRequestException for an already-paid booking', async () => {
        bookingsRepo.findById.mockResolvedValue(pendingBooking);
        paymentsRepo.findByBookingId.mockResolvedValue({
          id: 'existing-payment',
          bookingId,
          status: PaymentStatus.SUCCESS,
        });

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Booking is already paid',
        );
      });

      it('reuses an existing PENDING payment that has a transactionId', async () => {
        const existingPayment = {
          id: 'existing-payment',
          bookingId,
          amount: 599,
          status: PaymentStatus.PENDING,
          transactionId: razorpayOrderId,
        };
        bookingsRepo.findById.mockResolvedValue(pendingBooking);
        paymentsRepo.findByBookingId.mockResolvedValue(existingPayment);

        const result = await service.createOrder(customerId, dto);

        expect(result.orderId).toBe(razorpayOrderId);
        expect(result.amount).toBe(599);
        expect(result.currency).toBe('INR');
        expect(result.keyId).toBe('rzp_test_key');
        // Must NOT create another order or Payment
        expect(mockOrdersCreate).not.toHaveBeenCalled();
        expect(paymentsRepo.create).not.toHaveBeenCalled();
      });

      it('throws BadRequestException when an existing PENDING payment has no transactionId', async () => {
        const existingPayment = {
          id: 'existing-payment',
          bookingId,
          amount: 599,
          status: PaymentStatus.PENDING,
          transactionId: null,
        };
        bookingsRepo.findById.mockResolvedValue(pendingBooking);
        paymentsRepo.findByBookingId.mockResolvedValue(existingPayment);

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Existing payment is missing its Razorpay order ID',
        );
        expect(mockOrdersCreate).not.toHaveBeenCalled();
        expect(paymentsRepo.create).not.toHaveBeenCalled();
      });
    });

    describe('successful real Razorpay order creation', () => {
      beforeEach(() => {
        withCredentials();
        bookingsRepo.findById.mockResolvedValue(pendingBooking);
        paymentsRepo.findByBookingId.mockResolvedValue(null);
        mockOrdersCreate.mockResolvedValue(razorpayOrder);
        paymentsRepo.create.mockResolvedValue({
          id: 'payment-1',
          bookingId,
          amount: 599,
          method: 'CARD',
          status: PaymentStatus.PENDING,
          transactionId: razorpayOrderId,
        });
      });

      it('instantiates Razorpay with the configured credentials', async () => {
        await service.createOrder(customerId, dto);
        expect(MockRazorpayConstructor).toHaveBeenCalledWith({
          key_id: 'rzp_test_key',
          key_secret: 'rzp_test_secret',
        });
      });

      it('calls razorpay.orders.create with amount * 100, INR, and booking.id as receipt', async () => {
        await service.createOrder(customerId, dto);
        expect(mockOrdersCreate).toHaveBeenCalledWith({
          amount: 599 * 100,
          currency: 'INR',
          receipt: bookingId,
        });
      });

      it('persists the Payment with transactionId set to the Razorpay order.id', async () => {
        await service.createOrder(customerId, dto);
        expect(paymentsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            bookingId,
            amount: 599,
            method: 'CARD',
            status: PaymentStatus.PENDING,
            provider: 'razorpay',
            transactionId: razorpayOrderId,
          }),
        );
      });

      it('returns orderId = order.id, correct amount, INR, and the key', async () => {
        const result = await service.createOrder(customerId, dto);

        expect(result.orderId).toBe(razorpayOrderId);
        expect(result.amount).toBe(599);
        expect(result.currency).toBe('INR');
        expect(result.keyId).toBe('rzp_test_key');
        expect(result.payment).toBeDefined();
      });
    });

    describe('Razorpay SDK failure', () => {
      beforeEach(() => {
        withCredentials();
        bookingsRepo.findById.mockResolvedValue(pendingBooking);
        paymentsRepo.findByBookingId.mockResolvedValue(null);
      });

      it('does NOT create a local Payment record when Razorpay order creation fails', async () => {
        mockOrdersCreate.mockRejectedValue(new Error('Razorpay API error'));

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          'Razorpay API error',
        );
        expect(paymentsRepo.create).not.toHaveBeenCalled();
      });

      it('propagates the Razorpay error rather than swallowing it', async () => {
        const razorpayError = new Error('Bad Gateway from Razorpay');
        mockOrdersCreate.mockRejectedValue(razorpayError);

        await expect(service.createOrder(customerId, dto)).rejects.toThrow(
          razorpayError,
        );
      });
    });
  });

  // ─── verifyPayment ────────────────────────────────────────────────────────

  describe('verifyPayment', () => {
    const verifyDto = {
      razorpayOrderId: 'order_abc123',
      razorpayPaymentId: 'pay_xyz789',
      razorpaySignature: '',
    };

    const existingPayment = {
      id: 'payment-1',
      booking: { customerId },
    };

    it('throws NotFoundException when no payment matches the Razorpay order', async () => {
      paymentsRepo.findByProviderOrderId.mockResolvedValue(null);

      await expect(
        service.verifyPayment(customerId, verifyDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when the payment belongs to a different user', async () => {
      paymentsRepo.findByProviderOrderId.mockResolvedValue({
        ...existingPayment,
        booking: { customerId: 'someone-else' },
      });

      await expect(
        service.verifyPayment(customerId, verifyDto),
      ).rejects.toThrow('You do not own this payment');
    });

    it('rejects when RAZORPAY_SECRET is set and the signature is wrong', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'RAZORPAY_SECRET') return 'rzp_test_secret';
        return undefined;
      });
      paymentsRepo.findByProviderOrderId.mockResolvedValue(existingPayment);

      const dtoWithBadSig = { ...verifyDto, razorpaySignature: 'bad-sig' };
      await expect(
        service.verifyPayment(customerId, dtoWithBadSig),
      ).rejects.toThrow('Payment signature verification failed');
    });

    it('marks payment SUCCESS and returns it when signature is valid', async () => {
      const secret = 'rzp_test_secret';
      configService.get.mockImplementation((key: string) => {
        if (key === 'RAZORPAY_SECRET') return secret;
        return undefined;
      });
      paymentsRepo.findByProviderOrderId.mockResolvedValue(existingPayment);

      // Compute the valid signature the same way the service does.
      const validSig = createHmac('sha256', secret)
        .update(`${verifyDto.razorpayOrderId}|${verifyDto.razorpayPaymentId}`)
        .digest('hex');

      const updatedPayment = {
        ...existingPayment,
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
      };
      paymentsRepo.update.mockResolvedValue(updatedPayment);

      const result = await service.verifyPayment(customerId, {
        ...verifyDto,
        razorpaySignature: validSig,
      });

      expect(result.message).toBe('Payment verified successfully');
      expect(paymentsRepo.update).toHaveBeenCalledWith(
        existingPayment.id,
        expect.objectContaining({ status: PaymentStatus.SUCCESS }),
      );
    });
  });
});
