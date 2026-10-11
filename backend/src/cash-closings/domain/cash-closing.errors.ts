import { NotFoundDomainError } from '../../shared/domain/domain-error';

export class CashClosingRowNotFoundError extends NotFoundDomainError {
  constructor(date: string, rowIndex: number) {
    super('CashClosingRow', `${date}#${rowIndex}`);
  }
}
