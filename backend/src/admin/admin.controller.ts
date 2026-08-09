import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get platform stats (admin only)' })
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('users')
  async getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getUsers(page, limit);
  }

  @ApiOperation({ summary: 'List all bookings (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @Get('bookings')
  async getBookings(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getBookings(page, limit);
  }

  @ApiOperation({ summary: 'List support tickets (admin only)' })
  @Get('tickets')
  async getTickets(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getTickets(page, limit);
  }

  @ApiOperation({ summary: 'Approve or reject a helper verification' })
  @Put('helpers/:id/verify')
  async verifyHelper(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
  ) {
    return this.adminService.verifyHelper(id, approved);
  }
}
