import {
  NotFoundDomainError,
  UnauthorizedDomainError,
} from '../../shared/domain/domain-error';

export class InvalidCredentialsError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid username or password');
  }
}

export class InactiveUserError extends UnauthorizedDomainError {
  constructor() {
    super('User account is deactivated');
  }
}

export class AdminNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Admin', id);
  }
}

export class UserNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('User', id);
  }
}
