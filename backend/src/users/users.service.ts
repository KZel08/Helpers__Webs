import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
}
