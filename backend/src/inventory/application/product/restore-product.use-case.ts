import { Inject, Injectable, Optional } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import { ProductNotFoundError } from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

@Injectable()
export class RestoreProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(id: string): Promise<Product> {
    const updated = await this.products.setActive(id, true);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    this.realtime?.publish('inventory');
    return updated;
  }
}
