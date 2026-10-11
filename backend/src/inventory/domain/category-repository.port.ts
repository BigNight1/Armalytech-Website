import { Category } from './category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByNameCaseInsensitive(name: string): Promise<Category | null>;
  create(name: string): Promise<Category>;
  update(id: string, name: string): Promise<Category | null>;
  /** Deletes the category. No cascade: callers verify no product uses it. */
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
