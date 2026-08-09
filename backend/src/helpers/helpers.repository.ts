import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

@Injectable()
export class HelpersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; limit: number; categoryId?: string }) {
    const skip = (params.page - 1) * params.limit;
    const [helpers, total] = await this.prisma.$transaction([
      this.prisma.helperProfile.findMany({
        skip,
        take: params.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          services: params.categoryId
            ? { where: { categoryId: params.categoryId } }
            : true,
        },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.helperProfile.count(),
    ]);
    return { helpers, total };
  }

  async findById(id: string) {
    return this.prisma.helperProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, phone: true } },
        services: { include: { category: true, media: true } },
        availability: true,
        documents: { where: { verificationStatus: VerificationStatus.VERIFIED } },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.helperProfile.findUnique({
      where: { userId },
      include: { services: true, availability: true, documents: true },
    });
  }

  async createProfile(userId: string) {
    return this.prisma.helperProfile.create({
      data: { userId },
      include: { services: true, availability: true, documents: true },
    });
  }

  async updateProfile(id: string, data: Prisma.HelperProfileUpdateInput) {
    return this.prisma.helperProfile.update({ where: { id }, data });
  }

  async createDocument(data: Prisma.HelperDocumentUncheckedCreateInput) {
    return this.prisma.helperDocument.create({ data });
  }
}
