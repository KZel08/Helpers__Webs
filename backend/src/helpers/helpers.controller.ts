import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { HelpersService } from './helpers.service';
import { HelperGuard } from '../auth/guards/helper.guard';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

@ApiTags('Helpers')
@Controller('helpers')
export class HelpersController {
  constructor(private readonly helpersService: HelpersService) {}

  @ApiOperation({ summary: 'List all verified helpers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.helpersService.findAll({ page, limit, categoryId });
  }

  @ApiOperation({ summary: 'Get your helper profile' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, HelperGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.helpersService.getOrCreateProfile(user.sub);
  }

  @ApiOperation({ summary: 'Get helper profile by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.helpersService.findById(id);
  }

  @ApiOperation({ summary: 'Update your helper profile' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, HelperGuard)
  @Put('profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateHelperDto) {
    return this.helpersService.updateProfile(user.sub, dto);
  }

  @ApiOperation({ summary: 'Upload verification documents' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, HelperGuard)
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: DocumentType,
  ) {
    return this.helpersService.uploadDocument(user.sub, file, type);
  }
}
