/**
 * Compatibility catalog entry (was `models` pre-v2): a phone that products
 * can list as compatible. Carries no stock of its own.
 */
export interface Phone {
  id: string;
  brandId: string;
  name: string;
}

export interface PhoneWithBrand extends Phone {
  brandName: string;
}
