import { useCallback, useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Models for one brand, plus CRUD. Server is the source of truth: every
 * mutation refetches the list. No-op (empty list, no fetch) while
 * `brandId` is null, so callers can render this before a brand is picked.
 */
export function useModels(brandId) {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useToast();

  const refetch = useCallback(async () => {
    if (!brandId) {
      setModels([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.listModels(brandId);
      setModels(data);
    } catch (err) {
      setError(err);
      notify(err.message ?? 'No se pudieron cargar los modelos', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [brandId, notify]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createModel = useCallback(
    async (name) => {
      try {
        const model = await inventoryApi.createModel(brandId, name);
        await refetch();
        notify(`Modelo "${model.name}" creado`, { type: 'success' });
        return model;
      } catch (err) {
        notify(err.message ?? 'No se pudo crear el modelo', { type: 'error' });
        throw err;
      }
    },
    [brandId, refetch, notify],
  );

  const updateModel = useCallback(
    async (id, name) => {
      try {
        const model = await inventoryApi.updateModel(id, name);
        await refetch();
        notify(`Modelo "${model.name}" actualizado`, { type: 'success' });
        return model;
      } catch (err) {
        notify(err.message ?? 'No se pudo actualizar el modelo', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  const deleteModel = useCallback(
    async (id) => {
      try {
        await inventoryApi.deleteModel(id);
        await refetch();
        notify('Modelo eliminado', { type: 'success' });
      } catch (err) {
        notify(err.message ?? 'No se pudo eliminar el modelo', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  return { models, isLoading, error, refetch, createModel, updateModel, deleteModel };
}
