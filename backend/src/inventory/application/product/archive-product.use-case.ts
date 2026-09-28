import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import { ProductNotFoundError } from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

/** "Deleting" a product archives it (`active=false`); movements keep pointing to it. */
@Injectable()
export class ArchiveProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(id: string): Promise<void> {
    const updated = await this.products.setActive(id, false);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    this.realtime?.publish('inventory');
  }
}
