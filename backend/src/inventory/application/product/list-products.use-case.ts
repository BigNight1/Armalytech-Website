import { Inject, Injectable } from '@nestjs/common';
import { ProductListResult } from '../../domain/product-repository.port';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';

export interface ListProductsCommand {
  q?: string;
  categoryId?: string;
  phoneId?: string;
  lowStock?: boolean;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(input: ListProductsCommand): Promise<ProductListResult> {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));

    return this.products.list({
      q: input.q?.trim() || undefined,
      categoryId: input.categoryId,
      phoneId: input.phoneId,
      lowStock: input.lowStock,
      includeArchived: input.includeArchived,
      page,
      limit,
    });
  }
}
