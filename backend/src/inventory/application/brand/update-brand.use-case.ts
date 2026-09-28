import { Inject, Injectable, Optional } from '@nestjs/common';
import { Brand } from '../../domain/brand.entity';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import {
  BrandNotFoundError,
  DuplicateBrandNameError,
} from '../../domain/inventory.errors';
import { RealtimePublisher } from '../../../shared/realtime/realtime-publisher';

@Injectable()
export class UpdateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
    @Optional() private readonly realtime?: RealtimePublisher,
  ) {}

  async execute(id: string, name: string): Promise<Brand> {
    const existing = await this.brands.findByNameCaseInsensitive(name);
    if (existing && existing.id !== id) {
      throw new DuplicateBrandNameError(name);
    }

    const updated = await this.brands.update(id, name.trim());
    if (!updated) {
      throw new BrandNotFoundError(id);
    }
    this.realtime?.publish('inventory');
    return updated;
  }
}
