import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand.entity';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import { DuplicateBrandNameError } from '../../domain/inventory.errors';

@Injectable()
export class CreateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
  ) {}

  async execute(name: string): Promise<Brand> {
    const existing = await this.brands.findByNameCaseInsensitive(name);
    if (existing) {
      throw new DuplicateBrandNameError(name);
    }
    return this.brands.create(name.trim());
  }
}
