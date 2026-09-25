/**
 * JS mirror of `tokens.css`'s CSS custom properties, for code that can't
 * read CSS variables at draw time (Glide Data Grid renders to a canvas;
 * react-day-picker's own popover styling is done through class names, not a
 * theme object, but callers building a canvas/SVG chart later may want the
 * raw values too). Keep these numbers in sync with `tokens.css` by hand —
 * there are few enough tokens that duplicating them here beats a runtime
 * CSS-parsing step.
 */

const ACCENT_RAMP = {
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
};

export const themeTokens = {
  claro: {
    accent: ACCENT_RAMP,
    onAccent: '#0f172a',
    bg: '#f8fafc',
    surface: '#eef2f7',
    ink: '#0f172a',
    muted: '#475569',
    divider: 'rgba(15,23,42,.2)',
    sideBg: '#0f172a',
    sidePop: '#1e293b',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
    dangerInk: '#b91c1c',
    inkAccent: '#c2410c',
    rowHover: 'rgba(15,23,42,.05)',
    shadowLg: '0 16px 40px rgba(15,23,42,.2)',
  },
  oscuro: {
    accent: ACCENT_RAMP,
    onAccent: '#0f172a',
    bg: '#0f172a',
    surface: '#1e293b',
    ink: '#e2e8f0',
    muted: '#94a3b8',
    divider: 'rgba(226,232,240,.2)',
    sideBg: '#020617',
    sidePop: '#0f172a',
    danger: '#ef4444',
    dangerBg: 'rgba(239,68,68,.14)',
    dangerInk: '#fca5a5',
    inkAccent: '#fdba74',
    rowHover: 'rgba(226,232,240,.06)',
    shadowLg: '0 0 0 1px rgba(226,232,240,.08),0 18px 44px rgba(0,0,0,.55)',
  },
};

/** `themeTokens['claro' | 'oscuro']`, defaulting to light for an unknown value. */
export function getThemeTokens(theme) {
  return themeTokens[theme] ?? themeTokens.claro;
}

/**
 * Reads a live `--admin-*` CSS variable value from the DOM (e.g. for a
 * one-off read where the JS mirror above isn't convenient). `element`
 * defaults to the `.admin-shell` root so it reflects the *current* theme
 * without needing to know which one is active.
 */
export function readAdminCssVar(name, element) {
  const target = element ?? document.querySelector('.admin-shell');
  if (!target) return '';
  return getComputedStyle(target).getPropertyValue(name).trim();
}
