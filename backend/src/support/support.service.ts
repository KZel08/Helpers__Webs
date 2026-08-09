import { Injectable } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private readonly supportRepo: SupportRepository) {}

  async createTicket(userId: string, dto: CreateTicketDto) {
    return this.supportRepo.create({
      userId,
      title: dto.title,
      message: dto.message,
      priority: dto.priority,
    });
  }

  async getMyTickets(userId: string) {
    return this.supportRepo.findByUser(userId);
  }
}
