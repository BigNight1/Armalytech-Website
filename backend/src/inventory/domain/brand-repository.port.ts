import { Brand } from './brand.entity';

export const BRAND_REPOSITORY = Symbol('BRAND_REPOSITORY');

export interface BrandRepository {
  findAll(): Promise<Brand[]>;
  findById(id: string): Promise<Brand | null>;
  findByNameCaseInsensitive(name: string): Promise<Brand | null>;
  create(name: string): Promise<Brand>;
  update(id: string, name: string): Promise<Brand | null>;
  /** Deletes the brand and cascades to its models and their parts. */
  deleteCascade(id: string): Promise<boolean>;
}
