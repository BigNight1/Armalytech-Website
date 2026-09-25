/**
 * Glide Data Grid theme for the Historial spreadsheet (R2c), rebuilt from
 * `shared/theme/tokens.js` (the JS mirror of `tokens.css`) so the grid
 * follows the admin light/dark tokens live — Glide draws on canvas and can't
 * read CSS variables or Tailwind classes directly, so `CashClosingsGrid`
 * re-derives this theme with `useMemo` whenever `useTheme()`'s `theme`
 * changes. Match is "as closely as the Theme API allows" (canvas ≠ pixel
 * identical to the DOM design, accepted scope limitation) — see
 * `odd/tasks/rediseno-panel.md` R2c.
 */
import { getThemeTokens } from '../../shared/theme/tokens.js';

// Matches `.admin-shell`'s `font-family: 'Archivo', system-ui, sans-serif`.
const FONT_FAMILY = "'Archivo', system-ui, sans-serif";

/** Base theme applied to the whole `DataEditor` for the given admin theme (`'claro' | 'oscuro'`). */
export function buildGridTheme(theme) {
  const t = getThemeTokens(theme);
  const isDark = theme === 'oscuro';
  return {
    accentColor: t.accent[500],
    accentFg: t.onAccent,
    accentLight: t.accent[100],

    textDark: t.ink,
    textMedium: t.ink,
    // Row numbers gutter text color - high contrast so row index (1, 2, 3...) is clearly legible
    textLight: isDark ? '#cbd5e1' : '#334155',
    textBubble: t.ink,
    // Header text contrast for non-grouped columns like Estado
    textHeader: isDark ? '#e2e8f0' : '#0f172a',
    textHeaderSelected: t.onAccent,
    textGroupHeader: t.onAccent,
    bgIconHeader: isDark ? '#cbd5e1' : '#475569',
    fgIconHeader: t.surface,

    bgCell: t.bg,
    bgCellMedium: t.surface,
    bgHeader: t.surface,
    bgHeaderHasFocus: t.accent[100],
    bgHeaderHovered: t.accent[100],

    bgBubble: t.surface,
    bgBubbleSelected: t.accent[500],
    bgSearchResult: t.accent[200],

    borderColor: t.divider,
    horizontalBorderColor: t.divider,
    headerBottomBorderColor: t.divider,
    drilldownBorder: t.accent[500],

    linkColor: t.accent[600],

    cellHorizontalPadding: 12,
    cellVerticalPadding: 6,

    headerFontStyle: '600 13px',
    baseFontStyle: '14px',
    fontFamily: FONT_FAMILY,
    editorFontSize: '14px',

    lineHeight: 1.4,
    // Design: 0 radius everywhere — squares off the selection/marching-ants
    // corners too (the closest canvas equivalent of "no rounded corners").
    roundingRadius: 0,
  };
}

/**
 * Builds the `getGroupDetails` callback for the grouped INGRESOS / GASTOS
 * column headers (design: accent-filled "Ingresos" band, ink-filled
 * "Gastos" band spanning their 3 columns each). Columns without a `.group`
 * (row-number gutter, Estado) fall through to the empty-string case, themed
 * to the page background so they read as blank like the design's bare cells
 * instead of inheriting the column-header row's surface tint.
 */
export function buildGetGroupDetails(theme) {
  const t = getThemeTokens(theme);
  const isDark = theme === 'oscuro';
  return function getGroupDetails(groupName) {
    if (groupName === 'ingresos') {
      return {
        name: 'INGRESOS',
        overrideTheme: {
          bgHeader: t.accent[500],
          textGroupHeader: '#0f172a',
          textHeader: '#0f172a',
          headerFontStyle: '700 13px',
        },
      };
    }
    if (groupName === 'gastos') {
      return {
        name: 'GASTOS',
        overrideTheme: {
          bgHeader: isDark ? '#1e293b' : '#0f172a',
          textGroupHeader: '#ffffff',
          textHeader: isDark ? '#f1f5f9' : '#ffffff',
          headerFontStyle: '700 13px',
        },
      };
    }
    return {
      name: '',
      overrideTheme: {
        bgHeader: t.bg,
        textHeader: isDark ? '#e2e8f0' : '#0f172a',
      },
    };
  };
}

/**
 * Row-level overrides: a bold/surface-tinted look for the synthetic totals
 * row (design's "Total" row under the data), a subtle red tint while a row
 * is in `error` (T15 save-status indicator) — in that priority order.
 */
export function buildRowThemeOverride(theme) {
  const t = getThemeTokens(theme);
  return function rowThemeOverride(status, { isTotals = false } = {}) {
    if (isTotals) {
      return { bgCell: t.surface, baseFontStyle: '800 14px', textDark: t.ink };
    }
    if (status === 'error') {
      return { bgCell: t.dangerBg };
    }
    return undefined;
  };
}
