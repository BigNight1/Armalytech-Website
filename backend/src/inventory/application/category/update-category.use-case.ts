import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../domain/category.entity';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';
import {
  CategoryNotFoundError,
  DuplicateCategoryNameError,
} from '../../domain/inventory.errors';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(id: string, name: string): Promise<Category> {
    const existing = await this.categories.findByNameCaseInsensitive(name);
    if (existing && existing.id !== id) {
      throw new DuplicateCategoryNameError(name);
    }

    const updated = await this.categories.update(id, name.trim());
    if (!updated) {
      throw new CategoryNotFoundError(id);
    }
    return updated;
  }
}
