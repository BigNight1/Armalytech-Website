import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';

/** ADR 0006 (2026-09-25 update): default catalog, seeded once when the collection is empty. */
export const DEFAULT_CATEGORY_NAMES = [
  'Pantallas',
  'Micas',
  'Zócalos',
  'Cables',
  'Cargadores',
  'Parlantes',
  'Audífonos',
  'Repuestos',
];

@Injectable()
export class SeedDefaultCategoriesUseCase {
  private readonly logger = new Logger(SeedDefaultCategoriesUseCase.name);

  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(): Promise<void> {
    const existingCount = await this.categories.count();
    if (existingCount > 0) {
      return;
    }

    for (const name of DEFAULT_CATEGORY_NAMES) {
      await this.categories.create(name);
    }
    this.logger.log(
      `Seeded ${DEFAULT_CATEGORY_NAMES.length} default inventory categories.`,
    );
  }
}
