import { Inject, Injectable } from '@nestjs/common';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import {
  CategoryInUseError,
  CategoryNotFoundError,
} from '../../domain/inventory.errors';

/** No cascade: blocks with 409 when any product still uses this category. */
@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id);
    }

    const inUse = await this.products.existsByCategory(id);
    if (inUse) {
      throw new CategoryInUseError(id);
    }

    await this.categories.delete(id);
  }
}
