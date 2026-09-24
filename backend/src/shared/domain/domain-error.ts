/**
 * Base class for every domain-level error. Framework-free: infrastructure
 * (a Nest exception filter) maps these to HTTP status codes, never the
 * other way around.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundDomainError extends DomainError {
  readonly code = 'not_found';

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`);
  }
}

export class ConflictDomainError extends DomainError {
  readonly code = 'conflict';

  constructor(message: string) {
    super(message);
  }
}

export class ValidationDomainError extends DomainError {
  readonly code = 'validation_error';

  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedDomainError extends DomainError {
  readonly code = 'unauthorized';

  constructor(message: string) {
    super(message);
  }
}
