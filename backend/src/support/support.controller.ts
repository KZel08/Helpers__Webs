import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @ApiOperation({ summary: 'Create a support ticket' })
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get my support tickets' })
  @Get()
  async getMine(@CurrentUser() user: JwtPayload) {
    return this.supportService.getMyTickets(user.sub);
  }
}
