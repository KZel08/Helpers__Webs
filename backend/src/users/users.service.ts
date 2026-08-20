import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingUser = await this.usersRepo.findByPhone(dto.phone);

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(
          'An account with this phone number already exists',
        );
      }
    }

    return this.usersRepo.update(userId, dto);
  }

  async deleteAccount(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.softDelete(userId);
    return { message: 'Account deleted successfully' };
  }

  // ─── Address operations ─────────────────────────────────────────────────

  async getAddresses(userId: string) {
    return this.usersRepo.findAddresses(userId);
  }

  async getAddressById(userId: string, addressId: string) {
    const address = await this.usersRepo.findAddressById(addressId);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.usersRepo.clearDefaultAddresses(userId);
    }

    return this.usersRepo.createAddress(userId, dto);
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.usersRepo.findAddressById(addressId);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    if (dto.isDefault) {
      await this.usersRepo.clearDefaultAddresses(userId);
    }

    return this.usersRepo.updateAddress(addressId, dto);
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.usersRepo.findAddressById(addressId);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    await this.usersRepo.deleteAddress(addressId);
    return { message: 'Address deleted successfully' };
  }
}
