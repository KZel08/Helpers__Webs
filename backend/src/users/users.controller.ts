import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @ApiOperation({ summary: 'Update user profile' })
  @Put('profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }
}
