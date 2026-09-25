import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../shared/domain/domain-error';

export class BrandNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Brand', id);
  }
}

export class PhoneNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Phone', id);
  }
}

export class CategoryNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Category', id);
  }
}

export class ProductNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Product', id);
  }
}

export class DuplicateBrandNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`A brand named "${name}" already exists`);
  }
}

export class DuplicatePhoneNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`A phone named "${name}" already exists for this brand`);
  }
}

export class DuplicateCategoryNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`A category named "${name}" already exists`);
  }
}

/** No cascade (inventory v2 decision): deleting a referenced brand would silently break products and movement history. */
export class BrandInUseError extends ConflictDomainError {
  constructor(id: string) {
    super(
      `Brand "${id}" is referenced by a phone or a product and cannot be deleted`,
    );
  }
}

export class PhoneInUseError extends ConflictDomainError {
  constructor(id: string) {
    super(
      `Phone "${id}" is listed as compatible by a product and cannot be deleted`,
    );
  }
}

export class CategoryInUseError extends ConflictDomainError {
  constructor(id: string) {
    super(`Category "${id}" is used by a product and cannot be deleted`);
  }
}

export class InsufficientStockError extends ConflictDomainError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Product "${productId}" has insufficient stock: requested ${requested}, available ${available}`,
    );
  }
}
