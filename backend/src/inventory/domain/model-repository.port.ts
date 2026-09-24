import { InventoryModel } from './model.entity';

export const MODEL_REPOSITORY = Symbol('MODEL_REPOSITORY');

export interface ModelRepository {
  findByBrand(brandId: string): Promise<InventoryModel[]>;
  findById(id: string): Promise<InventoryModel | null>;
  create(brandId: string, name: string): Promise<InventoryModel>;
  update(id: string, name: string): Promise<InventoryModel | null>;
  /** Deletes the model and cascades to its parts. */
  deleteCascade(id: string): Promise<boolean>;
}
