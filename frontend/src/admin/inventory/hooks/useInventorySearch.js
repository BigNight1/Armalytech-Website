import { useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi.js';

const DEBOUNCE_MS = 300;

/** Debounced cross-collection search (`GET /inventory/search?q=`). */
export function useInventorySearch(query) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await inventoryApi.search(trimmed);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, isLoading };
}
