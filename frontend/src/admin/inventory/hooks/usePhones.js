import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

const IN_USE_MESSAGE = 'No se puede eliminar: hay productos que la usan';

/**
 * Full compatibility-phone catalog (list + create/rename/delete). Always
 * fetches every phone — the catalog is small (a phone repair shop's model
 * list), so brand filtering for the "Celulares" panel and the product
 * form's multi-select both happen client-side against this one query,
 * joined with `useBrands()` for `brandName` (the backend returns bare
 * `{id, brandId, name}`).
 */
export function usePhones() {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventoryKeys.phones(),
    queryFn: () => inventoryApi.listPhones(),
  });

  useQueryErrorToast(query.error, 'No se pudieron cargar los celulares');

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: inventoryKeys.phones() }),
      queryClient.invalidateQueries({ queryKey: [...inventoryKeys.all, 'products'] }),
    ]);

  const createMutation = useMutation({
    mutationFn: ({ brandId, name }) => inventoryApi.createPhone(brandId, name),
    onSuccess: async (created) => {
      await invalidate();
      notify(`Celular "${created.name}" creado`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear el celular', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => inventoryApi.updatePhone(id, changes),
    onSuccess: async () => {
      await invalidate();
      notify('Celular actualizado', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar el celular', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.deletePhone(id),
    onSuccess: async () => {
      await invalidate();
      notify('Celular eliminado', { type: 'success' });
    },
    onError: (err) =>
      notify(err.status === 409 ? IN_USE_MESSAGE : (err.message ?? 'No se pudo eliminar el celular'), {
        type: 'error',
      }),
  });

  return {
    phones: query.data ?? [],
    isLoading: query.isLoading,
    // Returns the created phone so callers (the product form's inline
    // "Agregar celular") can select it immediately.
    createPhone: (brandId, name) => createMutation.mutateAsync({ brandId, name }),
    updatePhone: (id, changes) => updateMutation.mutateAsync({ id, changes }),
    deletePhone: (id) => deleteMutation.mutateAsync(id),
  };
}
