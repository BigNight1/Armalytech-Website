import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Models for one brand, plus CRUD (T14: TanStack Query). Disabled (no fetch)
 * while `brandId` is null, so callers can render this before a brand is
 * picked — same behavior as the previous manual-fetch hook.
 */
export function useModels(brandId) {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventoryKeys.models(brandId),
    queryFn: () => inventoryApi.listModels(brandId),
    enabled: Boolean(brandId),
  });

  if (query.error) {
    notify(query.error.message ?? 'No se pudieron cargar los modelos', { type: 'error' });
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: inventoryKeys.models(brandId) });

  const createMutation = useMutation({
    mutationFn: (name) => inventoryApi.createModel(brandId, name),
    onSuccess: async (model) => {
      await invalidate();
      notify(`Modelo "${model.name}" creado`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear el modelo', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => inventoryApi.updateModel(id, name),
    onSuccess: async (model) => {
      await invalidate();
      notify(`Modelo "${model.name}" actualizado`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar el modelo', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.deleteModel(id),
    onSuccess: async () => {
      await invalidate();
      notify('Modelo eliminado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo eliminar el modelo', { type: 'error' }),
  });

  return {
    models: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createModel: (name) => createMutation.mutateAsync(name),
    updateModel: (id, name) => updateMutation.mutateAsync({ id, name }),
    deleteModel: (id) => deleteMutation.mutateAsync(id),
  };
}
