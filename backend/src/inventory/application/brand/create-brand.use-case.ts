import { Inject, Injectable, Optional } from '@nestjs/common';
import { Brand } from '../../domain/brand.entity';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import { DuplicateBrandNameError } from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

@Injectable()
export class CreateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(name: string): Promise<Brand> {
    const existing = await this.brands.findByNameCaseInsensitive(name);
    if (existing) {
      throw new DuplicateBrandNameError(name);
    }
    const brand = await this.brands.create(name.trim());
    this.realtime?.publish('inventory');
    return brand;
  }
}
