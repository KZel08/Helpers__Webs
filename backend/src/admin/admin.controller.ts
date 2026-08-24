import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, ServiceRequestStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';
import { VerifyHelperDto } from './dto/verify-helper.dto';
import { ReviewServiceRequestDto } from '../service-requests/dto/review-service-request.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateAdminServiceDto } from './dto/create-admin-service.dto';

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

  @ApiOperation({ summary: 'List all service requests (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ServiceRequestStatus })
  @Get('service-requests')
  async getServiceRequests(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ServiceRequestStatus,
  ) {
    return this.adminService.getServiceRequests(page, limit, status);
  }

  @ApiOperation({ summary: 'Approve or reject a service request (admin only)' })
  @Put('service-requests/:id/review')
  async reviewServiceRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewServiceRequestDto,
  ) {
    return this.adminService.reviewServiceRequest(id, dto, user.sub);
  }

  @ApiOperation({ summary: 'List all service categories (admin only)' })
  @Get('categories')
  async getCategories() {
    return this.adminService.getCategories();
  }

  @ApiOperation({ summary: 'Create a service category (admin only)' })
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @ApiOperation({ summary: 'Update a service category (admin only)' })
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(id, dto);
  }

  @ApiOperation({ summary: 'Delete a service category (admin only)' })
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  @ApiOperation({ summary: 'List verified helpers (admin only)' })
  @Get('helpers')
  async getHelpers() {
    return this.adminService.getHelpers();
  }

  @ApiOperation({ summary: 'Create a service for a helper (admin only)' })
  @Post('services')
  async createService(@Body() dto: CreateAdminServiceDto) {
    return this.adminService.createService(dto);
  }

  @ApiOperation({ summary: 'Approve or reject a helper verification' })
  @Put('helpers/:id/verify')
  async verifyHelper(
    @Param('id') id: string,
    @Body() dto: VerifyHelperDto,
  ) {
    return this.adminService.verifyHelper(id, dto.approved);
  }
}
