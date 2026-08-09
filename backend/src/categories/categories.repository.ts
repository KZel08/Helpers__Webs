import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(data: { name: string; description?: string; icon?: string }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; description: string; icon: string }>) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
