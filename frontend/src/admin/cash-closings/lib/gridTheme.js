/**
 * Glide Data Grid theme for the Historial spreadsheet (T15), built from the
 * same brand hex values as `tailwind.config.js` (`brand.orange` / `brand.navy`
 * / `brand.ink`) since Glide draws on canvas and can't read Tailwind classes.
 * Kept in one place so any brand-color change only needs updating here (and
 * in `tailwind.config.js`).
 */
const BRAND = {
  orange: '#f97316',
  orangeLight: 'rgba(249, 115, 22, 0.18)',
  navy: '#0f172a',
  navyLight: '#1e293b',
  navyDark: '#020617',
  ink: '#e2e8f0',
  slate400: '#94a3b8',
  slate700: 'rgba(148, 163, 184, 0.25)',
};

// Tailwind's default `font-sans` stack — the admin panel doesn't override it,
// so the grid should render with the same family as the rest of the page.
const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Base dark-navy/orange theme applied to the whole `DataEditor`. */
export const gridTheme = {
  accentColor: BRAND.orange,
  accentFg: '#ffffff',
  accentLight: BRAND.orangeLight,

  textDark: BRAND.ink,
  textMedium: BRAND.ink,
  textLight: BRAND.slate400,
  textBubble: BRAND.ink,
  // Glide's defaults for these are dark grays meant for light themes — without
  // them the headers and row numbers are unreadable on navy.
  textHeader: BRAND.ink,
  textHeaderSelected: '#ffffff',
  textGroupHeader: BRAND.ink,
  bgIconHeader: BRAND.slate400,
  fgIconHeader: BRAND.navy,

  bgCell: BRAND.navy,
  bgCellMedium: BRAND.navyLight,
  bgHeader: BRAND.navyLight,
  bgHeaderHasFocus: '#334155',
  bgHeaderHovered: '#334155',

  bgBubble: BRAND.navyLight,
  bgBubbleSelected: BRAND.orange,
  bgSearchResult: 'rgba(249, 115, 22, 0.25)',

  borderColor: BRAND.slate700,
  horizontalBorderColor: BRAND.slate700,
  drilldownBorder: BRAND.orange,

  linkColor: BRAND.orange,

  cellHorizontalPadding: 8,
  cellVerticalPadding: 6,

  headerFontStyle: '600 13px',
  baseFontStyle: '14px',
  fontFamily: FONT_FAMILY,
  editorFontSize: '14px',

  lineHeight: 1.4,
  roundingRadius: 6,
};

/** Row-level overrides (T15 save-status indicator): a subtle red tint while a row is in `error`. */
export function rowThemeOverride(status) {
  if (status === 'error') {
    return { bgCell: 'rgba(248, 113, 113, 0.08)' };
  }
  return undefined;
}
