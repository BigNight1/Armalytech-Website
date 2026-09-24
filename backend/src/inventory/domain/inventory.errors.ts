import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../shared/domain/domain-error';

export class BrandNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Brand', id);
  }
}

export class ModelNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Model', id);
  }
}

export class PartNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Part', id);
  }
}

export class DuplicateBrandNameError extends ConflictDomainError {
  constructor(name: string) {
    super(`A brand named "${name}" already exists`);
  }
}

export class InsufficientStockError extends ConflictDomainError {
  constructor(partId: string, requested: number, available: number) {
    super(
      `Part "${partId}" has insufficient stock: requested ${requested}, available ${available}`,
    );
  }
}
