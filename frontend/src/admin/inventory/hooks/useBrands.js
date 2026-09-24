import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Brand list + CRUD (ADR 0009/0010: server is the source of truth).
 * TanStack Query (T14) replaces the manual fetch/refetch dance; mutations
 * invalidate `inventoryKeys.brands()` so every consumer refreshes together.
 * `createBrand`/`updateBrand`/`deleteBrand` still throw on failure so the
 * caller (a modal) can keep its form open.
 */
export function useBrands() {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventoryKeys.brands(),
    queryFn: inventoryApi.listBrands,
  });

  if (query.error) {
    notify(query.error.message ?? 'No se pudieron cargar las marcas', { type: 'error' });
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: inventoryKeys.brands() });

  const createMutation = useMutation({
    mutationFn: (name) => inventoryApi.createBrand(name),
    onSuccess: async (brand) => {
      await invalidate();
      notify(`Marca "${brand.name}" creada`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear la marca', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => inventoryApi.updateBrand(id, name),
    onSuccess: async (brand) => {
      await invalidate();
      notify(`Marca "${brand.name}" actualizada`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar la marca', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.deleteBrand(id),
    onSuccess: async () => {
      await invalidate();
      notify('Marca eliminada', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo eliminar la marca', { type: 'error' }),
  });

  return {
    brands: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createBrand: (name) => createMutation.mutateAsync(name),
    updateBrand: (id, name) => updateMutation.mutateAsync({ id, name }),
    deleteBrand: (id) => deleteMutation.mutateAsync(id),
  };
}
