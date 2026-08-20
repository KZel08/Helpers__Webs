import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { ServicesRepository } from '../services/services.repository';
import { HelpersRepository } from '../helpers/helpers.repository';
import { UsersRepository } from '../users/users.repository';
import { BookingStatus } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingsRepo: { create: jest.Mock };
  let servicesRepo: { findById: jest.Mock };
  let helpersRepo: { findByUserId: jest.Mock };
  let usersRepo: { findAddressById: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: { create: jest.fn() } },
        { provide: ServicesRepository, useValue: { findById: jest.fn() } },
        { provide: HelpersRepository, useValue: { findByUserId: jest.fn() } },
        { provide: UsersRepository, useValue: { findAddressById: jest.fn() } },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingsRepo = module.get(BookingsRepository);
    servicesRepo = module.get(ServicesRepository);
    helpersRepo = module.get(HelpersRepository);
    usersRepo = module.get(UsersRepository);
  });

  const customerId = 'customer-1';
  const serviceId = 'service-1';
  const helperId = 'helper-1';
  const addressId = 'address-1';

  const activeService = {
    id: serviceId,
    title: 'Cleaning',
    price: 500,
    helperId,
    isActive: true,
  };

  describe('create', () => {
    it('should create a booking with a valid owned address', async () => {
      const address = { id: addressId, userId: customerId, houseNo: '123' };
      servicesRepo.findById.mockResolvedValue(activeService);
      usersRepo.findAddressById.mockResolvedValue(address);
      bookingsRepo.create.mockResolvedValue({ id: 'booking-1', status: BookingStatus.PENDING });

      const dto = {
        serviceId,
        addressId,
        bookingDate: '2026-08-01T10:00:00.000Z',
      };

      const result = await service.create(customerId, dto);
      expect(result).toHaveProperty('id', 'booking-1');
      expect(bookingsRepo.create).toHaveBeenCalledWith(
        customerId,
        expect.objectContaining({
          serviceId,
          addressId,
          helperId,
          totalAmount: 500,
        }),
      );
    });

    it('should throw NotFoundException if address does not exist', async () => {
      servicesRepo.findById.mockResolvedValue(activeService);
      usersRepo.findAddressById.mockResolvedValue(null);

      const dto = {
        serviceId,
        addressId: 'nonexistent',
        bookingDate: '2026-08-01T10:00:00.000Z',
      };

      await expect(service.create(customerId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if address belongs to another user', async () => {
      servicesRepo.findById.mockResolvedValue(activeService);
      usersRepo.findAddressById.mockResolvedValue({ id: addressId, userId: 'other-user', houseNo: '123' });

      const dto = {
        serviceId,
        addressId,
        bookingDate: '2026-08-01T10:00:00.000Z',
      };

      await expect(service.create(customerId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if service is not found', async () => {
      servicesRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(customerId, {
          serviceId: 'nonexistent',
          addressId,
          bookingDate: '2026-08-01T10:00:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if service is inactive', async () => {
      servicesRepo.findById.mockResolvedValue({ ...activeService, isActive: false });

      await expect(
        service.create(customerId, {
          serviceId,
          addressId,
          bookingDate: '2026-08-01T10:00:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
