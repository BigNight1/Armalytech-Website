import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys, PRODUCTS_PAGE_SIZE } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Product catalog list — search (debounced ~250ms), category filter,
 * low-stock toggle, archived toggle, pagination — plus the product
 * CRUD/archive/restore/adjust mutations. Kept in one hook because every
 * mutation invalidates the same products query.
 */
export function useProducts() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryIdState] = useState(undefined);
  const [lowStock, setLowStockState] = useState(false);
  const [includeArchived, setIncludeArchivedState] = useState(false);
  const [page, setPage] = useState(1);
  const searchTimer = useRef(null);

  const { notify } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  function setSearch(value) {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQ(value);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }

  function setCategoryId(value) {
    setPage(1);
    setCategoryIdState(value);
  }

  function setLowStock(value) {
    setPage(1);
    setLowStockState(value);
  }

  function setIncludeArchived(value) {
    setPage(1);
    setIncludeArchivedState(value);
  }

  const params = {
    q: q.trim() || undefined,
    categoryId,
    lowStock: lowStock || undefined,
    includeArchived: includeArchived || undefined,
    page,
    limit: PRODUCTS_PAGE_SIZE,
  };
  const productsKey = inventoryKeys.products(params);

  const listQuery = useQuery({
    queryKey: productsKey,
    queryFn: () => inventoryApi.listProducts(params),
    placeholderData: keepPreviousData,
  });

  useQueryErrorToast(listQuery.error, 'No se pudieron cargar los productos');

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: [...inventoryKeys.all, 'products'] });

  const createMutation = useMutation({
    mutationFn: (payload) => inventoryApi.createProduct(payload),
    onSuccess: async (created) => {
      await invalidateList();
      notify(`Producto "${created.name}" creado`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear el producto', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => inventoryApi.updateProduct(id, changes),
    onSuccess: async () => {
      await invalidateList();
      notify('Producto actualizado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar el producto', { type: 'error' }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => inventoryApi.archiveProduct(id),
    onSuccess: async () => {
      await invalidateList();
      notify('Producto archivado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo archivar el producto', { type: 'error' }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => inventoryApi.restoreProduct(id),
    onSuccess: async () => {
      await invalidateList();
      notify('Producto restaurado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo restaurar el producto', { type: 'error' }),
  });

  // Optimistic +/- stock adjust (ADR 0009/0010 pattern, same as the old
  // `useParts.adjustQuantity`): patch the cached page immediately, roll
  // back on error (e.g. 409 insufficient stock), and show the backend's
  // message verbatim in a toast.
  const adjustMutation = useMutation({
    mutationFn: ({ id, delta }) => inventoryApi.adjustProductStock(id, { delta }),
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: productsKey });
      const previous = queryClient.getQueryData(productsKey);
      queryClient.setQueryData(productsKey, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productsKey, context.previous);
      }
      notify(err.message ?? 'No se pudo ajustar el stock', { type: 'error' });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(productsKey, (current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) }
          : current,
      );
    },
  });

  return {
    items: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    matchedPhones: listQuery.data?.matchedPhones ?? [],
    isLoading: listQuery.isLoading,
    searchInput,
    setSearch,
    categoryId,
    setCategoryId,
    lowStock,
    setLowStock,
    includeArchived,
    setIncludeArchived,
    page,
    setPage,
    pageSize: PRODUCTS_PAGE_SIZE,
    createProduct: (payload) => createMutation.mutateAsync(payload),
    updateProduct: (id, changes) => updateMutation.mutateAsync({ id, changes }),
    archiveProduct: (id) => archiveMutation.mutateAsync(id),
    restoreProduct: (id) => restoreMutation.mutateAsync(id),
    adjustStock: (id, delta) => adjustMutation.mutateAsync({ id, delta }),
  };
}
