import { Inject, Injectable } from '@nestjs/common';
import { StockMovementListResult } from '../../domain/stock-movement-repository.port';
import {
  StockMovementRepository,
  STOCK_MOVEMENT_REPOSITORY,
} from '../../domain/stock-movement-repository.port';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import { ProductNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class ListProductMovementsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly movements: StockMovementRepository,
  ) {}

  async execute(
    productId: string,
    page?: number,
    limit?: number,
  ): Promise<StockMovementListResult> {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 20));
    return this.movements.findByProduct(productId, safePage, safeLimit);
  }
}
