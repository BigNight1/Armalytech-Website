import { PhoneNumber } from './phone-number.vo';
import { ValidationDomainError } from '../../shared/domain/domain-error';

describe('PhoneNumber', () => {
  it.each([
    ['965728013', '51965728013'],
    ['+51965728013', '51965728013'],
    ['51965728013', '51965728013'],
    ['+51 965 728 013', '51965728013'],
    ['51 965 728 013', '51965728013'],
    ['965-728-013', '51965728013'],
    ['(51) 965-728-013', '51965728013'],
    ['  965728013  ', '51965728013'],
  ])('normalizes "%s" to "%s"', (raw, expected) => {
    expect(PhoneNumber.of(raw).toE164()).toBe(expected);
  });

  it.each([
    '123456789', // does not start with 9
    '5165728013', // wrong prefix / length
    '9657280', // too short
    '519657280131', // too long
    'not-a-number',
    '',
  ])('rejects invalid input "%s"', (raw) => {
    expect(() => PhoneNumber.of(raw)).toThrow(ValidationDomainError);
  });

  it('formats for display', () => {
    expect(PhoneNumber.of('965728013').toDisplay()).toBe('+51 965 728 013');
  });

  it('compares equality by normalized value', () => {
    const a = PhoneNumber.of('965728013');
    const b = PhoneNumber.of('+51 965 728 013');
    expect(a.equals(b)).toBe(true);
  });
});
