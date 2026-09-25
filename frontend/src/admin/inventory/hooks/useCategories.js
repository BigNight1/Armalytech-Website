import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi.js';
import { inventoryKeys } from '../api/queryKeys.js';
import { useToast } from '../../shared/ui/index.js';
import { useQueryErrorToast } from '../../shared/lib/useQueryErrorToast.js';

const IN_USE_MESSAGE = 'No se puede eliminar: hay productos que la usan';

/** Categories catalog (list + create/rename/delete). */
export function useCategories() {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: inventoryApi.listCategories,
  });

  useQueryErrorToast(query.error, 'No se pudieron cargar las categorías');

  // Category names are denormalized into each product's `category.name`, so
  // a rename must also refresh the products list.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() }),
      queryClient.invalidateQueries({ queryKey: [...inventoryKeys.all, 'products'] }),
    ]);

  const createMutation = useMutation({
    mutationFn: (name) => inventoryApi.createCategory(name),
    onSuccess: async (created) => {
      await invalidate();
      notify(`Categoría "${created.name}" creada`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo crear la categoría', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => inventoryApi.updateCategory(id, name),
    onSuccess: async () => {
      await invalidate();
      notify('Categoría actualizada', { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar la categoría', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.deleteCategory(id),
    onSuccess: async () => {
      await invalidate();
      notify('Categoría eliminada', { type: 'success' });
    },
    onError: (err) =>
      notify(err.status === 409 ? IN_USE_MESSAGE : (err.message ?? 'No se pudo eliminar la categoría'), {
        type: 'error',
      }),
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    createCategory: (name) => createMutation.mutateAsync(name),
    updateCategory: (id, name) => updateMutation.mutateAsync({ id, name }),
    deleteCategory: (id) => deleteMutation.mutateAsync(id),
  };
}
