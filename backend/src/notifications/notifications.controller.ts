import { Controller, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/services/token.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get all notifications for current user' })
  @Get()
  async getNotifications(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getNotifications(user.sub);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Put('read')
  @HttpCode(HttpStatus.OK)
  async markRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(user.sub);
  }
}
