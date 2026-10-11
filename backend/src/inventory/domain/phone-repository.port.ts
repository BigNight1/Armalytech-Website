import { Phone, PhoneWithBrand } from './phone.entity';

export const PHONE_REPOSITORY = Symbol('PHONE_REPOSITORY');

export interface UpdatePhoneInput {
  brandId?: string;
  name?: string;
}

export interface PhoneRepository {
  /** Lists phones, optionally filtered by brand. */
  findAll(brandId?: string): Promise<Phone[]>;
  findById(id: string): Promise<Phone | null>;
  findByIds(ids: string[]): Promise<Phone[]>;
  findByBrandAndNameCaseInsensitive(
    brandId: string,
    name: string,
  ): Promise<Phone | null>;
  /**
   * Case-insensitive "contains" match on `name` across every brand, with the
   * brand name populated — powers the product search box ("A54").
   */
  searchByNameWithBrand(query: string): Promise<PhoneWithBrand[]>;
  findByIdsWithBrand(ids: string[]): Promise<PhoneWithBrand[]>;
  create(brandId: string, name: string): Promise<Phone>;
  update(id: string, input: UpdatePhoneInput): Promise<Phone | null>;
  /** Deletes the phone. No cascade: callers verify no product references it. */
  delete(id: string): Promise<boolean>;
}
