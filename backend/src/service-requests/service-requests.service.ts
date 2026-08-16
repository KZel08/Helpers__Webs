import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceRequestsRepository } from './service-requests.repository';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ReviewServiceRequestDto } from './dto/review-service-request.dto';
import { ServiceRequestStatus } from '@prisma/client';

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly repo: ServiceRequestsRepository) {}

  async create(helperId: string, dto: CreateServiceRequestDto) {
    return this.repo.create({
      helperId,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
      suggestedPrice: dto.suggestedPrice,
      suggestedPriceType: dto.suggestedPriceType,
      suggestedDuration: dto.suggestedDuration,
    });
  }

  async findMany(params: {
    page: number;
    limit: number;
    status?: ServiceRequestStatus;
    helperId?: string;
    categoryId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 10, 50);

    return this.repo.findMany({
      ...params,
      page,
      limit,
    });
  }

  async findById(id: string) {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException('Service request not found');
    }
    return request;
  }

  async review(
    id: string,
    dto: ReviewServiceRequestDto,
    reviewerId: string,
  ) {
    return this.repo.reviewAndCreateService(id, {
      approved: dto.approved,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      priceType: dto.priceType,
      duration: dto.duration,
      adminNotes: dto.adminNotes,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    });
  }
}