/**
 * Client-side mirror of the backend's `PhoneNumber` value object (ADR 0014).
 * Only a light pre-check before submitting: the backend is the source of
 * truth and re-validates/normalizes on every request.
 */
const CANONICAL_PATTERN = /^519\d{8}$/;

/** Returns the normalized `51XXXXXXXXX` string, or `null` if invalid. */
export function normalizePeruvianPhone(raw) {
  const stripped = (raw ?? '').replace(/[^\d+]/g, '');
  const withoutPlus = stripped.startsWith('+') ? stripped.slice(1) : stripped;

  let candidate = withoutPlus;
  if (candidate.length === 9 && candidate.startsWith('9')) {
    candidate = `51${candidate}`;
  }

  return CANONICAL_PATTERN.test(candidate) ? candidate : null;
}

export function isValidPeruvianPhone(raw) {
  return normalizePeruvianPhone(raw) !== null;
}

/** Formats an already-normalized `51XXXXXXXXX` number as `+51 9XX XXX XXX`. */
export function formatPeruvianPhone(phoneE164) {
  if (!phoneE164 || phoneE164.length !== 11) {
    return phoneE164 ?? '';
  }
  const national = phoneE164.slice(2);
  return `+51 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

/**
 * Live-formats raw keystrokes into `9XX XXX XXX` groups as the user types
 * (design's `fmtPhone`, ADR 0012 board `/registrar/usuario`): strips
 * non-digits, caps at 9 digits, groups 3-3-3.
 */
export function formatNationalPhoneInput(raw) {
  const digits = (raw ?? '').replace(/\D/g, '').slice(0, 9);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)]
    .filter(Boolean)
    .join(' ');
}
