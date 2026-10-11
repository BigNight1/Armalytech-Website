import { Inject, Injectable, Optional } from '@nestjs/common';
import { Category } from '../../domain/category.entity';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';
import { DuplicateCategoryNameError } from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(name: string): Promise<Category> {
    const existing = await this.categories.findByNameCaseInsensitive(name);
    if (existing) {
      throw new DuplicateCategoryNameError(name);
    }
    const category = await this.categories.create(name.trim());
    this.realtime?.publish('inventory');
    return category;
  }
}
