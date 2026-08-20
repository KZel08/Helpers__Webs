import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { HelpersRepository } from '../helpers/helpers.repository';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceRequestDto } from '../service-requests/dto/create-service-request.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepo: ServicesRepository,
    private readonly helpersRepo: HelpersRepository,
    private readonly serviceRequestsService: ServiceRequestsService,
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
    return this.servicesRepo.findAll({
      ...query,
      page,
      limit,
    });
  }

  async findById(id: string) {
    const service = await this.servicesRepo.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
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

  async createServiceRequest(userId: string, dto: CreateServiceRequestDto) {
    const profile = await this.helpersRepo.findByUserId(userId);

    if (!profile || profile.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Only verified helpers can request new services',
      );
    }

    return this.serviceRequestsService.create(profile.id, dto);
  }

  async getMyServiceRequests(userId: string, page = 1, limit = 10) {
    const profile = await this.helpersRepo.findByUserId(userId);

    if (!profile || profile.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Only verified helpers can view service requests',
      );
    }

    return this.serviceRequestsService.findMany({
      page,
      limit,
      helperId: profile.id,
    });
  }
}
