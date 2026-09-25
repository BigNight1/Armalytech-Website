import { Inject, Injectable } from '@nestjs/common';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import {
  PhoneRepository,
  PHONE_REPOSITORY,
} from '../../domain/phone-repository.port';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import {
  BrandInUseError,
  BrandNotFoundError,
} from '../../domain/inventory.errors';

/** No cascade (inventory v2 decision): blocks with 409 when a phone or product still references the brand. */
@Injectable()
export class DeleteBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new BrandNotFoundError(id);
    }

    const referencedByPhone = (await this.phones.findAll(id)).length > 0;
    const referencedByProduct = await this.products.existsByBrand(id);
    if (referencedByPhone || referencedByProduct) {
      throw new BrandInUseError(id);
    }

    await this.brands.delete(id);
  }
}
