import { Inject, Injectable, Optional } from '@nestjs/common';
import { Category } from '../../domain/category.entity';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';
import {
  CategoryNotFoundError,
  DuplicateCategoryNameError,
} from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
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
    this.realtime?.publish('inventory');
    return updated;
  }
}
