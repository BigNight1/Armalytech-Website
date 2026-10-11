import {
  buildModelKeyCandidates,
  normalizeKey,
  toTitleCase,
} from './phone-normalizer';

describe('normalizeKey', () => {
  const cases: [input: string, expected: string][] = [
    ['Samsung', 'samsung'],
    ['SaMsung', 'samsung'],
    ['  Samsung  ', 'samsung'],
    ['A53', 'a53'],
    ['a-53', 'a53'],
    ['a  53', 'a53'],
    ['Baterías', 'baterias'],
    ['Pantallás', 'pantallas'],
    ['Galaxy A53', 'galaxya53'],
    ['galaxy   a53', 'galaxya53'],
    ['iPhone 12', 'iphone12'],
    ['MOTO g9 play', 'motog9play'],
  ];

  it.each(cases)('normalizes %j to %j', (input, expected) => {
    expect(normalizeKey(input)).toBe(expected);
  });
});

describe('toTitleCase', () => {
  const cases: [input: string, expected: string][] = [
    ['samsung', 'Samsung'],
    ['SAMSUNG', 'Samsung'],
    ['a53', 'A53'],
    ['A53', 'A53'],
    ['galaxy a53', 'Galaxy A53'],
    ['  redmi   note 10  ', 'Redmi Note 10'],
  ];

  it.each(cases)('title-cases %j to %j', (input, expected) => {
    expect(toTitleCase(input)).toBe(expected);
  });
});

describe('buildModelKeyCandidates', () => {
  const cases: [
    rawModel: string,
    brandName: string | undefined,
    expected: string[],
  ][] = [
    // Bare model, nothing to strip.
    ['A53', 'Samsung', ['a53']],
    // Family-word prefix ("galaxy") also tries the bare model.
    ['Galaxy A53', 'Samsung', ['galaxya53', 'a53']],
    ['galaxy a53', 'Samsung', ['galaxya53', 'a53']],
    // Brand name itself as the leading word is also stripped.
    ['Samsung A53', 'Samsung', ['samsunga53', 'a53']],
    // "iphone" is a known family prefix regardless of the resolved brand.
    ['iPhone 12', 'Apple', ['iphone12', '12']],
    // No recognized leading word: only the full key is tried.
    ['Note 10 Pro', 'Xiaomi', ['note10pro']],
    // No brand supplied still strips a known family prefix.
    ['Moto G9 Play', undefined, ['motog9play', 'g9play']],
  ];

  it.each(cases)(
    'builds candidates for %j (brand %j)',
    (rawModel, brandName, expected) => {
      expect(buildModelKeyCandidates(rawModel, brandName)).toEqual(expected);
    },
  );
});
