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
  StockMovementRepository,
  STOCK_MOVEMENT_REPOSITORY,
} from '../../domain/stock-movement-repository.port';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  PhoneNotFoundError,
} from '../../domain/inventory.errors';
import { roundMoney } from '../../../shared/domain/money';
import { Actor } from './actor';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

export interface CreateProductCommand {
  categoryId: string;
  brandId?: string;
  name: string;
  model?: string;
  stock: number;
  cost: number;
  salePrice: number;
  minStock: number;
  compatiblePhoneIds?: string[];
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Inject(PHONE_REPOSITORY) private readonly phones: PhoneRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly movements: StockMovementRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(input: CreateProductCommand, actor: Actor): Promise<Product> {
    const category = await this.categories.findById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    if (input.brandId) {
      const brand = await this.brands.findById(input.brandId);
      if (!brand) {
        throw new BrandNotFoundError(input.brandId);
      }
    }

    const compatiblePhoneIds = input.compatiblePhoneIds ?? [];
    await this.assertPhonesExist(compatiblePhoneIds);

    const product = await this.products.create({
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      name: input.name.trim(),
      model: input.model?.trim(),
      stock: input.stock,
      cost: roundMoney(input.cost),
      salePrice: roundMoney(input.salePrice),
      minStock: input.minStock,
      compatiblePhoneIds,
    });

    if (input.stock > 0) {
      await this.movements.create({
        productId: product.id,
        type: 'ajuste_entrada',
        quantity: input.stock,
        stockAfter: product.stock,
        reference: null,
        reason: 'Stock inicial',
        userId: actor.userId,
        userEmail: actor.userEmail,
      });
    }

    this.realtime?.publish('inventory');

    return product;
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
