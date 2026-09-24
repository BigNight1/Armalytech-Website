import { ValidationDomainError } from '../../shared/domain/domain-error';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A `YYYY-MM-DD` calendar day in the America/Lima business timezone
 * (UTC-5, no DST). Validated at construction so every other layer can trust
 * the shape without re-checking it.
 */
export class BusinessDate {
  private constructor(private readonly value: string) {}

  static of(raw: string): BusinessDate {
    if (!DATE_PATTERN.test(raw)) {
      throw new ValidationDomainError(
        `"${raw}" is not a valid YYYY-MM-DD business date`,
      );
    }

    const [year, month, day] = raw.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const isValidCalendarDate =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;

    if (!isValidCalendarDate) {
      throw new ValidationDomainError(`"${raw}" is not a valid calendar date`);
    }

    return new BusinessDate(raw);
  }

  /** Lima has no DST, so a plain UTC-midnight Date is enough to compare/sort. */
  toDate(): Date {
    const [year, month, day] = this.value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  toString(): string {
    return this.value;
  }

  static todayInLima(): BusinessDate {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return BusinessDate.of(parts);
  }
}
