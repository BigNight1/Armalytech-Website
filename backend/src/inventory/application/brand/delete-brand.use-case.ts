import { Inject, Injectable } from '@nestjs/common';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';
import { BrandNotFoundError } from '../../domain/inventory.errors';

@Injectable()
export class DeleteBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.brands.deleteCascade(id);
    if (!deleted) {
      throw new BrandNotFoundError(id);
    }
  }
}
