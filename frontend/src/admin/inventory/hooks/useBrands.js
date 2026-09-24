import { useCallback, useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Brand list + CRUD (ADR 0009/0010: server is the source of truth, refetch
 * after every mutation). `createBrand`/`updateBrand`/`deleteBrand` throw
 * `ApiError` on failure so the caller (a modal) can keep its form open.
 */
export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useToast();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.listBrands();
      setBrands(data);
    } catch (err) {
      setError(err);
      notify(err.message ?? 'No se pudieron cargar las marcas', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createBrand = useCallback(
    async (name) => {
      try {
        const brand = await inventoryApi.createBrand(name);
        await refetch();
        notify(`Marca "${brand.name}" creada`, { type: 'success' });
        return brand;
      } catch (err) {
        notify(err.message ?? 'No se pudo crear la marca', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  const updateBrand = useCallback(
    async (id, name) => {
      try {
        const brand = await inventoryApi.updateBrand(id, name);
        await refetch();
        notify(`Marca "${brand.name}" actualizada`, { type: 'success' });
        return brand;
      } catch (err) {
        notify(err.message ?? 'No se pudo actualizar la marca', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  const deleteBrand = useCallback(
    async (id) => {
      try {
        await inventoryApi.deleteBrand(id);
        await refetch();
        notify('Marca eliminada', { type: 'success' });
      } catch (err) {
        notify(err.message ?? 'No se pudo eliminar la marca', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  return { brands, isLoading, error, refetch, createBrand, updateBrand, deleteBrand };
}
