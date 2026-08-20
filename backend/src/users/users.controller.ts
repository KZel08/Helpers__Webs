import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
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

  @ApiOperation({ summary: 'Create a new address' })
  @Post('addresses')
  async createAddress(@CurrentUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.sub, dto);
  }

  @ApiOperation({ summary: 'List all addresses for the current user' })
  @Get('addresses')
  async getAddresses(@CurrentUser() user: JwtPayload) {
    return this.usersService.getAddresses(user.sub);
  }

  @ApiOperation({ summary: 'Get an address by ID' })
  @Get('addresses/:id')
  async getAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.getAddressById(user.sub, id);
  }

  @ApiOperation({ summary: 'Update an address' })
  @Put('addresses/:id')
  async updateAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.usersService.updateAddress(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Delete an address' })
  @Delete('addresses/:id')
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id);
  }
}
