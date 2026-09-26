/**
 * Pure normalization helpers behind `POST /api/inventory/phones/resolve`
 * (ADR 0025, "Actualización 2026-09-26" #2): let an admin type a brand/model
 * freely ("SaMsung", "galaxy a53") and match it against the existing
 * catalog regardless of case, accents, or extra spacing, falling back to
 * creating a new catalog entry in title case when nothing matches.
 *
 * Deliberately simple and deterministic, per the ADR's explicit request —
 * no fuzzy/edit-distance matching, just a normalized-key comparison plus a
 * small fixed list of "family" words that are common as a spoken prefix but
 * are not part of every catalog entry's stored name.
 */

/** Leading words commonly said before a model number but not always stored with it. */
export const MODEL_FAMILY_PREFIXES = ['galaxy', 'redmi', 'iphone', 'moto'];

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Lowercase, accent-stripped, alphanumerics-only key. Stripping every
 * non-alphanumeric character also absorbs repeated/irregular spacing for
 * free (" A53 " and "a-53" both become "a53").
 */
export function normalizeKey(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Title-cases each whitespace-separated word: a word containing a digit is
 * upper-cased whole (preserves model codes like "a53" -> "A53"); otherwise
 * only its first letter is capitalized ("samsung" -> "Samsung").
 */
export function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) =>
      /[0-9]/.test(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
}

/**
 * Every normalized key worth trying when matching a freely-typed model
 * against the catalog: the full text as typed, and — when the first word is
 * a known family prefix (or the resolved brand's own name) — the text with
 * that leading word dropped, so "galaxy a53" also tries "a53" and matches a
 * catalog entry stored as bare "A53".
 */
export function buildModelKeyCandidates(
  rawModel: string,
  brandName?: string,
): string[] {
  const candidates: string[] = [];
  const fullKey = normalizeKey(rawModel);
  if (fullKey) {
    candidates.push(fullKey);
  }

  const words = rawModel.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const firstWordKey = normalizeKey(words[0]);
    const restKey = normalizeKey(words.slice(1).join(' '));
    const brandKey = brandName ? normalizeKey(brandName) : '';
    const shouldStrip =
      restKey.length > 0 &&
      (MODEL_FAMILY_PREFIXES.includes(firstWordKey) ||
        (brandKey.length > 0 && firstWordKey === brandKey));
    if (shouldStrip && !candidates.includes(restKey)) {
      candidates.push(restKey);
    }
  }

  return candidates;
}
