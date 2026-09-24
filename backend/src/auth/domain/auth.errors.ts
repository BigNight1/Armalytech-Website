import {
  NotFoundDomainError,
  UnauthorizedDomainError,
} from '../../shared/domain/domain-error';

export class InvalidCredentialsError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid username or password');
  }
}

export class AdminNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Admin', id);
  }
}
