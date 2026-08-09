import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    limit: number;
    categoryId?: string;
    helperId?: string;
    search?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: Record<string, unknown> = { isActive: true };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.helperId) where.helperId = params.helperId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          category: true,
          helper: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          media: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { services, total };
  }

  async findById(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        helper: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true, phone: true } },
          },
        },
        media: true,
      },
    });
  }

  async create(helperId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        helperId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        priceType: dto.priceType,
        duration: dto.duration,
      },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  async findByHelperUserId(userId: string) {
    return this.prisma.service.findMany({
      where: { helper: { userId } },
      include: { category: true },
    });
  }
}
