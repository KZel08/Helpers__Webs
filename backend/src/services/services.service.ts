import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { HelpersRepository } from '../helpers/helpers.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepo: ServicesRepository,
    private readonly helpersRepo: HelpersRepository,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    categoryId?: string;
    helperId?: string;
    search?: string;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    return this.servicesRepo.findAll({ page, limit, ...query });
  }

  async findById(id: string) {
    const service = await this.servicesRepo.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(userId: string, dto: CreateServiceDto) {
    const profile = await this.helpersRepo.findByUserId(userId);
    if (!profile) throw new ForbiddenException('You must be a verified helper to create services');
    return this.servicesRepo.create(profile.id, dto);
  }

  async update(userId: string, serviceId: string, dto: UpdateServiceDto) {
    const service = await this.findById(serviceId);
    const profile = await this.helpersRepo.findByUserId(userId);
    if (!profile || service.helperId !== profile.id) {
      throw new ForbiddenException('You do not own this service');
    }
    return this.servicesRepo.update(serviceId, dto);
  }

  async delete(userId: string, serviceId: string) {
    const service = await this.findById(serviceId);
    const profile = await this.helpersRepo.findByUserId(userId);
    if (!profile || service.helperId !== profile.id) {
      throw new ForbiddenException('You do not own this service');
    }
    await this.servicesRepo.delete(serviceId);
    return { message: 'Service deleted successfully' };
  }
}
