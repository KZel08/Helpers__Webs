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
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

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

  @ApiOperation({ summary: 'Get service by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @ApiOperation({ summary: 'Create a new service (helpers only)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.sub, dto);
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
}
