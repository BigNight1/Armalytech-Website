import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

const PAGE_SIZE = 20;

/** Paginated stock movements (kardex) for one product, newest first. */
export function useProductMovements(productId) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [productId]);

  const params = { page, limit: PAGE_SIZE };

  const query = useQuery({
    queryKey: inventoryKeys.movements(productId, params),
    queryFn: () => inventoryApi.listProductMovements(productId, params),
    enabled: Boolean(productId),
  });

  useQueryErrorToast(query.error, 'No se pudieron cargar los movimientos');

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    page,
    setPage,
    pageSize: PAGE_SIZE,
  };
}
