import { BusinessDate } from './business-date.vo';
import { ValidationDomainError } from '../../shared/domain/domain-error';

describe('BusinessDate', () => {
  it('accepts a valid YYYY-MM-DD date', () => {
    expect(BusinessDate.of('2026-09-23').toString()).toBe('2026-09-23');
  });

  it('rejects a malformed string', () => {
    expect(() => BusinessDate.of('23-09-2026')).toThrow(ValidationDomainError);
  });

  it('rejects an impossible calendar date', () => {
    expect(() => BusinessDate.of('2026-02-30')).toThrow(ValidationDomainError);
  });
});
