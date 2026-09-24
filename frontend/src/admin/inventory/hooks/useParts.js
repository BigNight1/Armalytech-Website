import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Parts for one model (T14: TanStack Query). Create/update/delete invalidate
 * the parts query (server is the source of truth). `adjustQuantity` (the
 * +/- stock buttons) stays optimistic via `onMutate`/`onError` — it patches
 * the cached list immediately and rolls it back if the backend rejects the
 * change (409 insufficient stock), per ADR 0009/0010.
 */
export function useParts(modelId) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const partsKey = inventoryKeys.parts(modelId);

  const query = useQuery({
    queryKey: partsKey,
    queryFn: () => inventoryApi.listParts(modelId),
    enabled: Boolean(modelId),
  });

  if (query.error) {
    notify(query.error.message ?? 'No se pudieron cargar los repuestos', { type: 'error' });
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: partsKey });

  const createMutation = useMutation({
    mutationFn: (part) => inventoryApi.createPart(modelId, part),
    onSuccess: async (created) => {
      await invalidate();
      notify(`Repuesto "${created.name}" creado`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear el repuesto', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => inventoryApi.updatePart(id, changes),
    onSuccess: invalidate,
    onError: (err) => notify(err.message ?? 'No se pudo actualizar el repuesto', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.deletePart(id),
    onSuccess: async () => {
      await invalidate();
      notify('Repuesto eliminado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo eliminar el repuesto', { type: 'error' }),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, delta }) => inventoryApi.adjustPartQuantity(id, delta),
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: partsKey });
      const previousParts = queryClient.getQueryData(partsKey);
      queryClient.setQueryData(partsKey, (current) =>
        (current ?? []).map((part) =>
          part.id === id ? { ...part, quantity: Math.max(0, part.quantity + delta) } : part,
        ),
      );
      return { previousParts };
    },
    onError: (err, _variables, context) => {
      if (context?.previousParts) {
        queryClient.setQueryData(partsKey, context.previousParts);
      }
      notify(err.message ?? 'No se pudo ajustar el stock', { type: 'error' });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(partsKey, (current) =>
        (current ?? []).map((part) => (part.id === updated.id ? updated : part)),
      );
    },
  });

  return {
    parts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPart: (part) => createMutation.mutateAsync(part),
    updatePart: (id, changes) => updateMutation.mutateAsync({ id, changes }),
    deletePart: (id) => deleteMutation.mutateAsync(id),
    adjustQuantity: (id, delta) => adjustMutation.mutateAsync({ id, delta }),
  };
}
