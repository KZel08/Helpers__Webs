import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  async findAll() {
    return this.categoriesRepo.findAll();
  }

  async findById(id: string) {
    const cat = await this.categoriesRepo.findById(id);
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(data: { name: string; description?: string; icon?: string }) {
    return this.categoriesRepo.create(data);
  }

  async update(id: string, data: Partial<{ name: string; description: string; icon: string }>) {
    await this.findById(id);
    return this.categoriesRepo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.categoriesRepo.delete(id);
    return { message: 'Category deleted' };
  }
}
