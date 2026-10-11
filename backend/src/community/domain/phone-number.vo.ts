import { ValidationDomainError } from '../../shared/domain/domain-error';

/**
 * A Peruvian WhatsApp number normalized to E.164 without the leading `+`
 * (ADR 0014): `51` followed by 9 digits, the first of which is `9`.
 *
 * Accepts common input variants (`+51 965 728 013`, `965728013`,
 * `51-965-728-013`, ...): spaces, dashes, parentheses and an optional
 * leading `+`/`51` are stripped before validating.
 */
export class PhoneNumber {
  private static readonly CANONICAL_PATTERN = /^519\d{8}$/;

  private constructor(private readonly value: string) {}

  static of(raw: string): PhoneNumber {
    const stripped = (raw ?? '').replace(/[^\d+]/g, '');
    const withoutPlus = stripped.startsWith('+') ? stripped.slice(1) : stripped;

    let candidate = withoutPlus;
    if (candidate.length === 9 && candidate.startsWith('9')) {
      candidate = `51${candidate}`;
    }

    if (!PhoneNumber.CANONICAL_PATTERN.test(candidate)) {
      throw new ValidationDomainError(
        `"${raw}" is not a valid Peruvian WhatsApp number`,
      );
    }

    return new PhoneNumber(candidate);
  }

  toE164(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  /** Formats for display: `+51 9XX XXX XXX`. */
  toDisplay(): string {
    const national = this.value.slice(2);
    return `+51 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
