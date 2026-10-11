import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

const IN_USE_MESSAGE = 'No se puede eliminar: hay celulares o productos que la usan';

/** Brands catalog (list + create/rename/delete). */
export function useBrands() {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventoryKeys.brands(),
    queryFn: inventoryApi.listBrands,
  });

  useQueryErrorToast(query.error, 'No se pudieron cargar las marcas');

  // Brand names are denormalized into products (`brand.name`) and phones
  // (joined client-side), so a rename must refresh both.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: inventoryKeys.brands() }),
      queryClient.invalidateQueries({ queryKey: inventoryKeys.phones() }),
      queryClient.invalidateQueries({ queryKey: [...inventoryKeys.all, 'products'] }),
    ]);

  const createMutation = useMutation({
    mutationFn: (name) => inventoryApi.createBrand(name),
    onSuccess: async (created) => {
      await invalidate();
      notify(`Marca "${created.name}" creada`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear la marca', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => inventoryApi.updateBrand(id, name),
    onSuccess: async () => {
      await invalidate();
      notify('Marca actualizada', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar la marca', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.deleteBrand(id),
    onSuccess: async () => {
      await invalidate();
      notify('Marca eliminada', { type: 'success' });
    },
    onError: (err) =>
      notify(err.status === 409 ? IN_USE_MESSAGE : (err.message ?? 'No se pudo eliminar la marca'), {
        type: 'error',
      }),
  });

  return {
    brands: query.data ?? [],
    isLoading: query.isLoading,
    createBrand: (name) => createMutation.mutateAsync(name),
    updateBrand: (id, name) => updateMutation.mutateAsync({ id, name }),
    deleteBrand: (id) => deleteMutation.mutateAsync(id),
  };
}
