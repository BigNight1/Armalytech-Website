import { Brand } from './brand.entity';

export const BRAND_REPOSITORY = Symbol('BRAND_REPOSITORY');

export interface BrandRepository {
  findAll(): Promise<Brand[]>;
  findById(id: string): Promise<Brand | null>;
  findByIds(ids: string[]): Promise<Brand[]>;
  findByNameCaseInsensitive(name: string): Promise<Brand | null>;
  create(name: string): Promise<Brand>;
  update(id: string, name: string): Promise<Brand | null>;
  /**
   * Deletes the brand. No cascade (inventory v2 decision): callers must
   * verify no phone or product references the brand before calling this,
   * otherwise products and movement history would be orphaned.
   */
  delete(id: string): Promise<boolean>;
}
