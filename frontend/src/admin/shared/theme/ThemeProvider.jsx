import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import './tokens.css';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'armalytech-admin-theme';
const THEMES = ['claro', 'oscuro'];
const DEFAULT_THEME = 'claro'; // design's `temaInicial`

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode, quota, ...) — theme still works
    // for the session, it just won't persist across reloads.
  }
}

/**
 * Owns the admin light/dark theme and renders the `.admin-shell` root that
 * every admin token (`tokens.css`) and Tailwind semantic color
 * (`tailwind.config.js`) is scoped under. Wrap the whole `/admin/*` tree
 * once (see `AdminRoutes.jsx`) — including the login screen — so every
 * consumer of `shared/ui/*` resolves the CSS variables correctly.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStoredTheme() ?? DEFAULT_THEME);

  useEffect(() => {
    writeStoredTheme(theme);
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(THEMES.includes(next) ? next : DEFAULT_THEME);
  };

  const toggleTheme = () => {
    setThemeState((current) => (current === 'oscuro' ? 'claro' : 'oscuro'));
  };

  const value = useMemo(() => ({ theme, isDark: theme === 'oscuro', setTheme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {/* `.dark` (Modernist/task convention) + `data-theme` (explicit,
          easier to query from devtools or non-React code) both reflect the
          same state; tokens.css only relies on `.dark`. */}
      <div className={`admin-shell${theme === 'oscuro' ? ' dark' : ''}`} data-theme={theme === 'oscuro' ? 'dark' : 'light'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** `{ theme: 'claro' | 'oscuro', isDark, toggleTheme(), setTheme(theme) }`. */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
