import {
  NotFoundDomainError,
  ValidationDomainError,
} from '../../shared/domain/domain-error';

export class ClientNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super('Client', id);
  }
}

export class MarketingConsentRequiredError extends ValidationDomainError {
  constructor() {
    super('Marketing consent is required to register');
  }
}
