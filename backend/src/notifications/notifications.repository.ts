import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    return this.prisma.notification.create({ data });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
