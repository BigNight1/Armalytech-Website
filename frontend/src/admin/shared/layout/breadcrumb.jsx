import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const BreadcrumbContext = createContext(null);

/**
 * Backs the header's "Panel / Section / Subsection" breadcrumb (AdminLayout
 * renders <Header>, which reads this). The section itself ("Inventario",
 * "Historial de caja", ...) comes from the route (see `SECTION_LABELS` in
 * `Header.jsx`); this context only carries an optional *sub*-section label
 * that a feature page sets for a tab/detail view, e.g. `useBreadcrumb('Catálogo')`
 * on the Inventario > Catálogo tab renders "Panel / Inventario / Catálogo".
 */
export function BreadcrumbProvider({ children }) {
  const [extra, setExtra] = useState(null);
  const value = useMemo(() => ({ extra, setExtra }), [extra]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within AdminLayout (BreadcrumbProvider)');
  }
  return context;
}

/**
 * Feature pages call this with the current sub-section label (or `null` to
 * clear it), e.g.:
 *   useBreadcrumb(activeTab === 'catalogo' ? 'Catálogo' : null)
 * It's cleared automatically on unmount so navigating away never leaves a
 * stale crumb behind.
 */
export function useBreadcrumb(label) {
  const { setExtra } = useBreadcrumbContext();
  useEffect(() => {
    setExtra(label ?? null);
    return () => setExtra(null);
  }, [label, setExtra]);
}

/** Internal — used by `Header.jsx` to render the current sub-section crumb. */
export function useBreadcrumbExtra() {
  return useBreadcrumbContext().extra;
}
