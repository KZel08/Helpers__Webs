import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PriceType,
  ServiceRequestStatus,
} from '@prisma/client';

@Injectable()
export class ServiceRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    page: number;
    limit: number;
    status?: ServiceRequestStatus;
    helperId?: string;
    categoryId?: string;
  }) {
    const skip = (params.page - 1) * params.limit;

    const where: Record<string, unknown> = {};

    if (params.status) where.status = params.status;
    if (params.helperId) where.helperId = params.helperId;
    if (params.categoryId) where.categoryId = params.categoryId;

    const [requests, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          helper: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.serviceRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async findById(id: string) {
    return this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        helper: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: true,
      },
    });
  }

  async create(data: {
    helperId: string;
    categoryId: string;
    title: string;
    description?: string;
    suggestedPrice: number;
    suggestedPriceType: PriceType;
    suggestedDuration?: number;
  }) {
    return this.prisma.serviceRequest.create({
      data,
      include: {
        category: true,
        helper: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async reviewAndCreateService(
    id: string,
    data: {
      approved: boolean;
      title?: string;
      description?: string;
      price?: number;
      priceType?: PriceType;
      duration?: number;
      adminNotes?: string;
      reviewedBy: string;
      reviewedAt: Date;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      if (request.status !== ServiceRequestStatus.PENDING) {
        throw new ConflictException(
          `Service request has already been ${request.status.toLowerCase()}`,
        );
      }

      if (!data.approved) {
        return tx.serviceRequest.update({
          where: { id },
          data: {
            status: ServiceRequestStatus.REJECTED,
            adminNotes: data.adminNotes,
            reviewedBy: data.reviewedBy,
            reviewedAt: data.reviewedAt,
          },
          include: {
            category: true,
            helper: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });
      }

      if (
        !data.title ||
        data.price === undefined ||
        !data.priceType
      ) {
        throw new BadRequestException(
          'Approved service requires title, price, and price type',
        );
      }

      const service = await tx.service.create({
        data: {
          helperId: request.helperId,
          categoryId: request.categoryId,
          title: data.title,
          description: data.description ?? request.description,
          price: data.price,
          priceType: data.priceType,
          duration:
            data.duration !== undefined
              ? data.duration
              : request.suggestedDuration,
        },
      });

      const updatedRequest = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: ServiceRequestStatus.APPROVED,
          adminNotes: data.adminNotes,
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt,
        },
        include: {
          category: true,
          helper: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return {
        request: updatedRequest,
        service,
      };
    });
  }
}
