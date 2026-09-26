import { PhoneWithBrand } from './phone.entity';
import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface CreateProductInput {
  categoryId: string;
  brandId: string | null;
  name: string;
  model?: string;
  stock: number;
  cost: number;
  salePrice: number;
  minStock: number;
  compatiblePhoneIds: string[];
}

export interface UpdateProductInput {
  categoryId?: string;
  brandId?: string;
  name?: string;
  model?: string;
  minStock?: number;
  cost?: number;
  salePrice?: number;
  compatiblePhoneIds?: string[];
}

export interface ProductListFilter {
  q?: string;
  categoryId?: string;
  /**
   * Case/accent-insensitive prefix match on the category name (e.g. "pan" ->
   * "Pantallas"), used by `GET /api/tickets/availability?categoria=`. Ignored
   * when `categoryId` is also set.
   */
  categoriaText?: string;
  /**
   * Narrow substring match on product `name`/`model` only (unlike `q`, which
   * also matches brand/compatible-phone), used by
   * `GET /api/tickets/availability?q=`.
   */
  nameOrModel?: string;
  phoneId?: string;
  lowStock?: boolean;
  includeArchived?: boolean;
  page: number;
  limit: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  /** Phones matched by `q`, so the UI can render "Compatibles con Samsung A54". */
  matchedPhones: PhoneWithBrand[];
}

export interface ProductRepository {
  list(filter: ProductListFilter): Promise<ProductListResult>;
  findById(id: string): Promise<Product | null>;
  existsByCategory(categoryId: string): Promise<boolean>;
  existsByBrand(brandId: string): Promise<boolean>;
  existsByCompatiblePhone(phoneId: string): Promise<boolean>;
  create(input: CreateProductInput): Promise<Product>;
  /** `undefined` fields are left unchanged; `stock` is never part of this input. */
  update(id: string, input: UpdateProductInput): Promise<Product | null>;
  setActive(id: string, active: boolean): Promise<Product | null>;
  /**
   * Atomically applies `delta` to `stock` (conditional `$inc` filtered by
   * `stock >= -delta` when `delta < 0`, same pattern as the v1 part
   * repository). Returns `null` when the product does not exist and
   * `undefined` specifically when the conditional filter failed because of
   * insufficient stock.
   */
  adjustStock(id: string, delta: number): Promise<Product | null | undefined>;
}
