/**
 * Money is stored as a plain rounded number (2 decimals), per the feature
 * contract. No currency type is needed: the whole app uses a single
 * currency (PEN), so a value object would add ceremony without behavior.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
