import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../domain/category.entity';
import {
  CategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/category-repository.port';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(): Promise<Category[]> {
    return this.categories.findAll();
  }
}
