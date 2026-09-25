import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import { ProductNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class RestoreProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(id: string): Promise<Product> {
    const updated = await this.products.setActive(id, true);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    return updated;
  }
}
