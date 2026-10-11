/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily:{
        OpenSans : ["Open Sans", "sans-serif"],
        // Admin panel redesign (R1): Archivo 400/600/800, scoped to
        // `.admin-shell` by tokens.css — see src/admin/shared/theme/.
        archivo: ["Archivo", "system-ui", "sans-serif"],
      },
      colors: {
        // Kept working: other code may still use brand.* (public site's
        // hero colors: orange #f97316, navy #0f172a / #020617).
        brand: {
          orange: {
            DEFAULT: '#f97316',
            50: '#fff7ed',
            100: '#ffedd5',
            300: '#fdba74',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
          },
          navy: {
            DEFAULT: '#0f172a',
            light: '#1e293b',
            dark: '#020617',
          },
          ink: '#e2e8f0',
        },
        // Admin panel semantic tokens (R1). Each resolves a `--admin-*` CSS
        // variable from src/admin/shared/theme/tokens.css, scoped under
        // `.admin-shell` (light/dark values swap via `.admin-shell.dark`) —
        // see that file's header comment for why this isn't Tailwind's
        // `dark:` variant. Feature code should use these (`bg-surface
        // text-ink border-line`, `bg-accent text-on-accent`, ...) instead of
        // raw hex/slate classes. Full contract in src/admin/README.md.
        bg: 'var(--admin-bg)',
        surface: 'var(--admin-surface)',
        ink: 'var(--admin-ink)',
        muted: 'var(--admin-muted)',
        line: 'var(--admin-divider)',
        'row-hover': 'var(--admin-row-hover)',
        'on-accent': 'var(--admin-on-accent)',
        accent: {
          DEFAULT: 'var(--admin-accent)',
          100: 'var(--admin-accent-100)',
          200: 'var(--admin-accent-200)',
          300: 'var(--admin-accent-300)',
          400: 'var(--admin-accent-400)',
          500: 'var(--admin-accent-500)',
          600: 'var(--admin-accent-600)',
          700: 'var(--admin-accent-700)',
          800: 'var(--admin-accent-800)',
          900: 'var(--admin-accent-900)',
          ink: 'var(--admin-ink-accent)',
        },
        danger: {
          DEFAULT: 'var(--admin-danger)',
          bg: 'var(--admin-danger-bg)',
          ink: 'var(--admin-danger-ink)',
        },
        // Sidebar is always the dark-navy surface regardless of admin theme.
        side: {
          bg: 'var(--admin-side-bg)',
          pop: 'var(--admin-side-pop)',
          ink: 'var(--admin-side-ink)',
          muted: 'var(--admin-side-muted)',
          hover: 'var(--admin-side-hover)',
          active: 'var(--admin-side-active-bg)',
          'active-ink': 'var(--admin-side-active-ink)',
          divider: 'var(--admin-side-divider)',
        },
      },
      boxShadow: {
        'admin-lg': 'var(--admin-shadow-lg)',
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
    require('@tailwindcss/typography'),

]
}