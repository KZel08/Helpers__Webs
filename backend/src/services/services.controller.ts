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
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HelperGuard } from '../auth/guards/helper.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';
import { CreateServiceRequestDto } from '../service-requests/dto/create-service-request.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: 'List all active services' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.servicesService.findAll({ page, limit, categoryId, search });
  }

  @ApiOperation({ summary: 'Update a service (owner only)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Delete a service (owner only)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.servicesService.delete(user.sub, id);
  }

  @ApiOperation({ summary: 'Create a service request (helpers only)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, HelperGuard)
  @Post('requests')
  async createRequest(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceRequestDto) {
    return this.servicesService.createServiceRequest(user.sub, dto);
  }

  @ApiOperation({ summary: 'List my service requests (helpers only)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, HelperGuard)
  @Get('requests')
  async getMyRequests(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.servicesService.getMyServiceRequests(user.sub, page, limit);
  }

  @ApiOperation({ summary: 'Get service by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }
}
