import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../domain/category.entity';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';
import { DuplicateCategoryNameError } from '../../domain/inventory.errors';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(name: string): Promise<Category> {
    const existing = await this.categories.findByNameCaseInsensitive(name);
    if (existing) {
      throw new DuplicateCategoryNameError(name);
    }
    return this.categories.create(name.trim());
  }
}
