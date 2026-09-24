import { useCallback, useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Parts for one model. Create/update/delete refetch from the server
 * (source of truth). `adjustQuantity` (the +/- stock buttons) is optimistic
 * — it updates the row immediately and reverts it if the backend rejects
 * the change (409 insufficient stock), per ADR 0009/0010.
 */
export function useParts(modelId) {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useToast();

  const refetch = useCallback(async () => {
    if (!modelId) {
      setParts([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.listParts(modelId);
      setParts(data);
    } catch (err) {
      setError(err);
      notify(err.message ?? 'No se pudieron cargar los repuestos', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [modelId, notify]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createPart = useCallback(
    async (part) => {
      try {
        const created = await inventoryApi.createPart(modelId, part);
        await refetch();
        notify(`Repuesto "${created.name}" creado`, { type: 'success' });
        return created;
      } catch (err) {
        notify(err.message ?? 'No se pudo crear el repuesto', { type: 'error' });
        throw err;
      }
    },
    [modelId, refetch, notify],
  );

  const updatePart = useCallback(
    async (id, changes) => {
      try {
        const updated = await inventoryApi.updatePart(id, changes);
        await refetch();
        return updated;
      } catch (err) {
        notify(err.message ?? 'No se pudo actualizar el repuesto', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  const deletePart = useCallback(
    async (id) => {
      try {
        await inventoryApi.deletePart(id);
        await refetch();
        notify('Repuesto eliminado', { type: 'success' });
      } catch (err) {
        notify(err.message ?? 'No se pudo eliminar el repuesto', { type: 'error' });
        throw err;
      }
    },
    [refetch, notify],
  );

  /** Optimistic +/- stock adjustment; reverts the row on a rejected delta. */
  const adjustQuantity = useCallback(
    async (id, delta) => {
      let previousQuantity;
      setParts((current) =>
        current.map((part) => {
          if (part.id !== id) return part;
          previousQuantity = part.quantity;
          return { ...part, quantity: Math.max(0, part.quantity + delta) };
        }),
      );

      try {
        const updated = await inventoryApi.adjustPartQuantity(id, delta);
        setParts((current) => current.map((part) => (part.id === id ? updated : part)));
      } catch (err) {
        setParts((current) =>
          current.map((part) =>
            part.id === id && previousQuantity !== undefined
              ? { ...part, quantity: previousQuantity }
              : part,
          ),
        );
        notify(err.message ?? 'No se pudo ajustar el stock', { type: 'error' });
        throw err;
      }
    },
    [notify],
  );

  return { parts, isLoading, error, refetch, createPart, updatePart, deletePart, adjustQuantity };
}
