import { Part, PartSearchResult } from './part.entity';

export const PART_REPOSITORY = Symbol('PART_REPOSITORY');

export interface CreatePartInput {
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface UpdatePartInput {
  name?: string;
  quantity?: number;
  purchasePrice?: number;
  salePrice?: number;
}

export interface PartRepository {
  findByModel(modelId: string): Promise<Part[]>;
  findById(id: string): Promise<Part | null>;
  create(modelId: string, input: CreatePartInput): Promise<Part>;
  update(id: string, input: UpdatePartInput): Promise<Part | null>;
  delete(id: string): Promise<boolean>;
  /**
   * Atomically applies `delta` to `quantity`. When `delta` is negative, the
   * update only succeeds if `quantity + delta >= 0` (filter `quantity >=
   * -delta` at the database level) — returns `null` when the part does not
   * exist and `undefined` specifically when the conditional filter failed
   * because of insufficient stock, so the use case can tell the two apart.
   */
  adjustQuantity(id: string, delta: number): Promise<Part | null | undefined>;
  search(query: string): Promise<PartSearchResult[]>;
}
