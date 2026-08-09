import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepo: NotificationsRepository) {}

  async getNotifications(userId: string) {
    const notifications = await this.notificationsRepo.findByUser(userId);
    const unreadCount = await this.notificationsRepo.countUnread(userId);
    return { notifications, unreadCount };
  }

  async markRead(userId: string) {
    await this.notificationsRepo.markAllRead(userId);
    return { message: 'All notifications marked as read' };
  }

  async send(userId: string, title: string, message: string, type: NotificationType) {
    return this.notificationsRepo.create({ userId, title, message, type });
  }
}
