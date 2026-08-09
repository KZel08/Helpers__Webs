import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!user) throw new NotFoundException('User not found');
    return this.usersRepo.update(userId, { ...dto });
  }

  async deleteAccount(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.softDelete(userId);
    return { message: 'Account deleted successfully' };
  }
}
