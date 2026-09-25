import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import {
  StockMovementRepository,
  STOCK_MOVEMENT_REPOSITORY,
} from '../../domain/stock-movement-repository.port';
import {
  InsufficientStockError,
  ProductNotFoundError,
} from '../../domain/inventory.errors';
import { Actor } from './actor';

export interface AdjustProductStockCommand {
  delta: number;
  reason?: string;
}

/**
 * Applies a stock delta atomically at the adapter level (a conditional
 * `$inc` filtered by `stock >= -delta` when `delta < 0`), so two concurrent
 * adjustments can never race past zero (ADR 0006), then records the
 * movement.
 */
@Injectable()
export class AdjustProductStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly movements: StockMovementRepository,
  ) {}

  async execute(
    id: string,
    input: AdjustProductStockCommand,
    actor: Actor,
  ): Promise<Product> {
    const result = await this.products.adjustStock(id, input.delta);

    if (result === null) {
      throw new ProductNotFoundError(id);
    }

    if (result === undefined) {
      const current = await this.products.findById(id);
      if (!current) {
        throw new ProductNotFoundError(id);
      }
      throw new InsufficientStockError(id, -input.delta, current.stock);
    }

    await this.movements.create({
      productId: id,
      type: input.delta >= 0 ? 'ajuste_entrada' : 'ajuste_salida',
      quantity: input.delta,
      stockAfter: result.stock,
      reference: null,
      reason: input.reason,
      userId: actor.userId,
      userEmail: actor.userEmail,
    });

    return result;
  }
}
