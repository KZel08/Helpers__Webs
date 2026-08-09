import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List all service categories' })
  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Get a category by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }
}
