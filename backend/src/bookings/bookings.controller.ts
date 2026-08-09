import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Create a new booking' })
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'List my bookings' })
  @ApiQuery({ name: 'role', required: false, enum: ['customer', 'helper'] })
  @Get()
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query('role') role: 'customer' | 'helper' = 'customer',
  ) {
    return this.bookingsService.findMyBookings(user.sub, role);
  }

  @ApiOperation({ summary: 'Get a booking by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @ApiOperation({ summary: 'Update booking status or notes' })
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Cancel a booking' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.cancel(user.sub, id);
  }
}
