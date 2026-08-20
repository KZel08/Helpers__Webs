import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findAddresses: jest.Mock;
    findAddressById: jest.Mock;
    createAddress: jest.Mock;
    updateAddress: jest.Mock;
    deleteAddress: jest.Mock;
    clearDefaultAddresses: jest.Mock;
  };

  const mockRepo = () => ({
    findAddresses: jest.fn(),
    findAddressById: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    clearDefaultAddresses: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(UsersRepository);
  });

  const userId = 'user-1';

  describe('getAddresses', () => {
    it('should return addresses for the user', async () => {
      const addresses = [{ id: 'addr-1', userId, houseNo: '123' }];
      repo.findAddresses.mockResolvedValue(addresses);

      const result = await service.getAddresses(userId);
      expect(result).toBe(addresses);
      expect(repo.findAddresses).toHaveBeenCalledWith(userId);
    });
  });

  describe('getAddressById', () => {
    it('should return the address if it belongs to the user', async () => {
      const address = { id: 'addr-1', userId, houseNo: '123' };
      repo.findAddressById.mockResolvedValue(address);

      const result = await service.getAddressById(userId, 'addr-1');
      expect(result).toBe(address);
    });

    it('should throw NotFoundException if address does not exist', async () => {
      repo.findAddressById.mockResolvedValue(null);

      await expect(service.getAddressById(userId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if address belongs to another user', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'other-user', houseNo: '123' });

      await expect(service.getAddressById(userId, 'addr-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createAddress', () => {
    const dto: CreateAddressDto = {
      houseNo: '123',
      street: 'Baker Street',
      city: 'London',
      state: 'Greater London',
      country: 'UK',
      postalCode: 'NW1 6XE',
    };

    it('should create an address without isDefault', async () => {
      repo.createAddress.mockResolvedValue({ id: 'addr-1', userId, ...dto });

      const result = await service.createAddress(userId, dto);
      expect(result).toHaveProperty('id');
      expect(repo.clearDefaultAddresses).not.toHaveBeenCalled();
    });

    it('should clear previous defaults when isDefault is true', async () => {
      repo.clearDefaultAddresses.mockResolvedValue({ count: 1 });
      repo.createAddress.mockResolvedValue({ id: 'addr-1', userId, ...dto, isDefault: true });

      await service.createAddress(userId, { ...dto, isDefault: true });

      expect(repo.clearDefaultAddresses).toHaveBeenCalledWith(userId);
    });

    it('should NOT clear previous defaults when isDefault is false or omitted', async () => {
      repo.createAddress.mockResolvedValue({ id: 'addr-1', userId, ...dto });

      await service.createAddress(userId, { ...dto, isDefault: false });

      expect(repo.clearDefaultAddresses).not.toHaveBeenCalled();
    });
  });

  describe('updateAddress', () => {
    const dto: UpdateAddressDto = { street: 'New Street' };

    it('should update the address if owned by user', async () => {
      const address = { id: 'addr-1', userId, houseNo: '123' };
      repo.findAddressById.mockResolvedValue(address);
      repo.updateAddress.mockResolvedValue({ ...address, ...dto });

      const result = await service.updateAddress(userId, 'addr-1', dto);
      expect(result).toHaveProperty('street', 'New Street');
    });

    it('should throw NotFoundException if address does not exist', async () => {
      repo.findAddressById.mockResolvedValue(null);

      await expect(service.updateAddress(userId, 'nonexistent', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if address belongs to another user', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'other-user', houseNo: '123' });

      await expect(service.updateAddress(userId, 'addr-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should clear previous defaults when updating to isDefault: true', async () => {
      const address = { id: 'addr-1', userId, houseNo: '123' };
      repo.findAddressById.mockResolvedValue(address);
      repo.clearDefaultAddresses.mockResolvedValue({ count: 1 });
      repo.updateAddress.mockResolvedValue({ ...address, isDefault: true });

      await service.updateAddress(userId, 'addr-1', { isDefault: true });

      expect(repo.clearDefaultAddresses).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteAddress', () => {
    it('should delete the address if owned by user', async () => {
      const address = { id: 'addr-1', userId, houseNo: '123' };
      repo.findAddressById.mockResolvedValue(address);
      repo.deleteAddress.mockResolvedValue({});

      const result = await service.deleteAddress(userId, 'addr-1');
      expect(result).toHaveProperty('message');
    });

    it('should throw NotFoundException if address does not exist', async () => {
      repo.findAddressById.mockResolvedValue(null);

      await expect(service.deleteAddress(userId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if address belongs to another user', async () => {
      repo.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'other-user', houseNo: '123' });

      await expect(service.deleteAddress(userId, 'addr-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
