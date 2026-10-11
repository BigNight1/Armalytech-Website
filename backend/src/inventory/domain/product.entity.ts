export interface ProductCategoryRef {
  id: string;
  name: string;
}

export interface ProductBrandRef {
  id: string;
  name: string;
}

export interface ProductPhoneRef {
  id: string;
  name: string;
  brandName: string;
}

/**
 * Populated shape returned by every read/write operation, per the API
 * contract: relations (category, brand, compatiblePhones) always come back
 * resolved so the UI never has to issue follow-up lookups.
 */
export interface Product {
  id: string;
  category: ProductCategoryRef;
  brand: ProductBrandRef | null;
  name: string;
  model?: string;
  stock: number;
  cost: number;
  salePrice: number;
  minStock: number;
  compatiblePhones: ProductPhoneRef[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
