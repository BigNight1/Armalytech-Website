import { Inject, Injectable, Optional } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product-repository.port';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import {
  PhoneRepository,
  PHONE_REPOSITORY,
} from '../../domain/phone-repository.port';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  PhoneNotFoundError,
  ProductNotFoundError,
} from '../../domain/inventory.errors';
import { roundMoney } from '../../../shared/domain/money';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

/** Never includes `stock`: stock only changes through adjust (and, later, sales/tickets). */
export interface UpdateProductCommand {
  categoryId?: string;
  brandId?: string;
  name?: string;
  model?: string;
  minStock?: number;
  cost?: number;
  salePrice?: number;
  compatiblePhoneIds?: string[];
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(id: string, input: UpdateProductCommand): Promise<Product> {
    const current = await this.products.findById(id);
    if (!current) {
      throw new ProductNotFoundError(id);
    }

    if (input.categoryId !== undefined) {
      const category = await this.categories.findById(input.categoryId);
      if (!category) {
        throw new CategoryNotFoundError(input.categoryId);
      }
    }

    if (input.brandId) {
      const brand = await this.brands.findById(input.brandId);
      if (!brand) {
        throw new BrandNotFoundError(input.brandId);
      }
    }

    if (input.compatiblePhoneIds !== undefined) {
      await this.assertPhonesExist(input.compatiblePhoneIds);
    }

    const updated = await this.products.update(id, {
      categoryId: input.categoryId,
      brandId: input.brandId,
      name: input.name?.trim(),
      model: input.model?.trim(),
      minStock: input.minStock,
      cost: input.cost !== undefined ? roundMoney(input.cost) : undefined,
      salePrice:
        input.salePrice !== undefined ? roundMoney(input.salePrice) : undefined,
      compatiblePhoneIds: input.compatiblePhoneIds,
    });
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    this.realtime?.publish('inventory');
    return updated;
  }

  private async assertPhonesExist(ids: string[]): Promise<void> {
    for (const id of ids) {
      const phone = await this.phones.findById(id);
      if (!phone) {
        throw new PhoneNotFoundError(id);
      }
    }
  }
}
