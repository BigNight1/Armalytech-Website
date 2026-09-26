import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketQueryKeys } from '../api/queryKeys.js';
import { ticketsApi } from '../api/ticketsApi.js';
import { useToast } from '../../shared/ui/index.js';

/**
 * Technicians catalog: list (used by the new-ticket form's "Técnico"
 * select) plus create/activate/deactivate for the owner-only `/admin/tecnicos`
 * page (`GET /api/technicians`, `POST|PATCH /api/technicians`).
 */
export function useTechnicians() {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ticketQueryKeys.technicians,
    queryFn: () => ticketsApi.listTechnicians(),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ticketQueryKeys.technicians });

  const createMutation = useMutation({
    mutationFn: (payload) => ticketsApi.createTechnician(payload),
    onSuccess: async (created) => {
      await invalidate();
      notify(`Técnico "${created?.nombre ?? ''}" agregado`, { type: 'success' });
    },
    onError: (err) => notify(err.message ?? 'No se pudo agregar el técnico', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => ticketsApi.updateTechnician(id, changes),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (err) => notify(err.message ?? 'No se pudo actualizar el técnico', { type: 'error' }),
  });

  const technicians = query.data ?? [];

  return {
    technicians,
    activeTechnicians: technicians.filter((t) => t.activo !== false),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createTechnician: (nombre) => createMutation.mutateAsync({ nombre }),
    isCreating: createMutation.isPending,
    setTechnicianActive: (id, activo) => updateMutation.mutateAsync({ id, changes: { activo } }),
  };
}
