import { Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand.entity';
import {
  BrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/brand-repository.port';

@Injectable()
export class ListBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepository,
  ) {}

  async execute(): Promise<Brand[]> {
    return this.brands.findAll();
  }
}
