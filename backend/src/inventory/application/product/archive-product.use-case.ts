import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import { ProductNotFoundError } from '../../domain/inventory.errors';

/** "Deleting" a product archives it (`active=false`); movements keep pointing to it. */
@Injectable()
export class ArchiveProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const updated = await this.products.setActive(id, false);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
  }
}
