import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import { CategoriesService } from '../categories/categories.service';
import { ServicesRepository } from '../services/services.repository';
import { ServiceRequestStatus } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateAdminServiceDto } from './dto/create-admin-service.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly categoriesService: CategoriesService,
    private readonly servicesRepository: ServicesRepository,
  ) {}

  async getStats() {
    const [totalUsers, totalHelpers, totalBookings, totalRevenue, pendingVerifications] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.helperProfile.count(),
        this.prisma.booking.count({ where: { deletedAt: null } }),
        this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
        this.prisma.helperProfile.count({ where: { verificationStatus: 'PENDING' } }),
      ]);

    return {
      totalUsers,
      totalHelpers,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      pendingVerifications,
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return { users, total, page, limit };
  }

  async getBookings(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        include: {
          service: { select: { title: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
          helper: { include: { user: { select: { firstName: true, lastName: true } } } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where: { deletedAt: null } }),
    ]);
    return { bookings, total, page, limit };
  }

  async getTickets(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        skip,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count(),
    ]);
    return { tickets, total, page, limit };
  }

  async verifyHelper(helperId: string, approved: boolean) {
    return this.prisma.helperProfile.update({
      where: { id: helperId },
      data: { verificationStatus: approved ? 'VERIFIED' : 'REJECTED' },
    });
  }

  async getServiceRequests(page: number = 1, limit: number = 20, status?: string) {
    return this.serviceRequestsService.findMany({
      page,
      limit,
      status: status as ServiceRequestStatus | undefined,
    });
  }

  async reviewServiceRequest(id: string, dto: { approved: boolean; adminNotes?: string }, reviewerId: string) {
    return this.serviceRequestsService.review(id, dto, reviewerId);
  }

  async getCategories() {
    return this.categoriesService.findAll();
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  async deleteCategory(id: string) {
    return this.categoriesService.delete(id);
  }

  async createService(dto: CreateAdminServiceDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const helper = await this.prisma.helperProfile.findUnique({
      where: { id: dto.helperId },
    });

    if (!helper) {
      throw new NotFoundException('Helper profile not found');
    }

    if (helper.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Services can only be created for verified helpers',
      );
    }

    return this.servicesRepository.create(dto.helperId, {
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      price: dto.price,
      priceType: dto.priceType,
      duration: dto.duration,
    });
  }
}
