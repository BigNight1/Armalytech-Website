import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ListCategoriesUseCase } from '../application/category/list-categories.use-case';
import { CreateCategoryUseCase } from '../application/category/create-category.use-case';
import { UpdateCategoryUseCase } from '../application/category/update-category.use-case';
import { DeleteCategoryUseCase } from '../application/category/delete-category.use-case';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('inventory/categories')
export class CategoryController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Get()
  async list() {
    return { ok: true, data: await this.listCategories.execute() };
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return { ok: true, data: await this.createCategory.execute(dto.name) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return {
      ok: true,
      data: await this.updateCategory.execute(id, dto.name),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteCategory.execute(id);
  }
}
