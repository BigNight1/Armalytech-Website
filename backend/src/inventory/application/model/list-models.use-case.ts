import { Inject, Injectable } from '@nestjs/common';
import { InventoryModel } from '../../domain/model.entity';
import {
  ModelRepository,
  MODEL_REPOSITORY,
} from '../../domain/model-repository.port';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import { BrandNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class ListModelsUseCase {
  constructor(
    @Inject(MODEL_REPOSITORY) private readonly models: ModelRepository,
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
  ) {}

  async execute(brandId: string): Promise<InventoryModel[]> {
    const brand = await this.brands.findById(brandId);
    if (!brand) {
      throw new BrandNotFoundError(brandId);
    }
    return this.models.findByBrand(brandId);
  }
}
