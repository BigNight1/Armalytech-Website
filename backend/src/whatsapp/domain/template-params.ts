/** Meta rejects template text parameters longer than this. */
const MAX_PARAM_LENGTH = 1024;

/**
 * Makes a value safe to use as a template text parameter: Meta rejects
 * newlines, tabs and runs of 4+ spaces, and empty values.
 */
export function sanitizeTemplateParam(
  value: string | undefined | null,
  fallback = '-',
): string {
  const cleaned = (value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {4,}/g, ' ')
    .trim()
    .slice(0, MAX_PARAM_LENGTH)
    .trim();
  return cleaned || fallback;
}
