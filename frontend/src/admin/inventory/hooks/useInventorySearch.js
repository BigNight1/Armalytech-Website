import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';

const DEBOUNCE_MS = 300;

/** Debounced cross-collection search (`GET /inventory/search?q=`), T14: TanStack Query. */
export function useInventorySearch(query) {
  const [debounced, setDebounced] = useState(query.trim());

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useQuery({
    queryKey: inventoryKeys.search(debounced),
    queryFn: () => inventoryApi.search(debounced),
    enabled: debounced.length > 0,
    placeholderData: keepPreviousData,
  });

  return {
    results: debounced.length > 0 ? (search.data ?? []) : [],
    isLoading: debounced.length > 0 && search.isFetching,
  };
}
