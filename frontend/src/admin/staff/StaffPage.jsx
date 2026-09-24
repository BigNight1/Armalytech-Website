import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from './api/staffApi.js';
import { useAuth } from '../auth/useAuth.js';
import { useToast, Button, Input, Modal, ConfirmDialog, SkeletonTable } from '../shared/ui/index.js';

export default function StaffPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  const [confirmToggleUser, setConfirmToggleUser] = useState(null);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: async () => {
      const res = await staffApi.list();
      return Array.isArray(res) ? res : res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      notify('Personal creado correctamente con contraseña temporal', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setCreateModalOpen(false);
      setNewEmail('');
      setNewPassword('');
    },
    onError: (err) => {
      notify(err.message || 'Error al crear personal', { type: 'error' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }) => staffApi.toggleStatus(id, active),
    onSuccess: (_, variables) => {
      notify(
        variables.active
          ? 'Personal reactivado correctamente'
          : 'Personal desactivado y sus sesiones activas fueron cerradas',
        { type: 'success' },
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setConfirmToggleUser(null);
    },
    onError: (err) => {
      notify(err.message || 'Error al cambiar estado', { type: 'error' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }) => staffApi.resetPassword(id, password),
    onSuccess: () => {
      notify('Contraseña temporal asignada. El usuario deberá cambiarla al ingresar.', {
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setResetModalOpen(false);
      setSelectedStaff(null);
      setResetPasswordVal('');
    },
    onError: (err) => {
      notify(err.message || 'Error al resetear contraseña', { type: 'error' });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    createMutation.mutate({ email: newEmail, password: newPassword });
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaff || !resetPasswordVal) return;
    resetPasswordMutation.mutate({ id: selectedStaff.id, password: resetPasswordVal });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-brand-ink">Personal del Panel</h1>
          <p className="text-sm text-slate-400">
            Gestiona los accesos del equipo, crea credenciales temporales o desactiva usuarios.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>+ Nuevo personal</Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} columns={5} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-brand-navy">
          <table className="w-full text-left text-sm text-brand-ink">
            <thead className="border-b border-slate-700 bg-brand-navy-light text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Correo electrónico</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado por</th>
                <th className="px-4 py-3">Fecha registro</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No hay personal registrado aún.
                  </td>
                </tr>
              ) : (
                staffList.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-white">
                        {member.email}
                        {isSelf && (
                          <span className="ml-2 rounded bg-brand-orange/20 px-1.5 py-0.5 text-xs text-brand-orange">
                            Tú
                          </span>
                        )}
                        {member.mustChangePassword && (
                          <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                            Clave temporal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {member.role === 'owner' ? (
                          <span className="inline-flex rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                            Principal (Owner)
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                            Personal (Admin)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {member.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {member.createdBy ?? 'Sistema (Bootstrap)'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString('es-PE')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(member);
                              setResetPasswordVal('');
                              setResetModalOpen(true);
                            }}
                            className="rounded px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                          >
                            Resetear clave
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setConfirmToggleUser(member)}
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                member.active
                                  ? 'text-red-400 hover:bg-red-950/40'
                                  : 'text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                            >
                              {member.active ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo Personal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear nuevo personal"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-slate-400">
            Crea una cuenta con una contraseña temporal. En su primer ingreso, el sistema le exigirá
            crear su propia contraseña privada.
          </p>
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="ejemplo@armalytech.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña temporal"
            name="password"
            type="text"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando…' : 'Crear personal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Resetear Contraseña */}
      <Modal
        open={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setSelectedStaff(null);
        }}
        title={`Resetear contraseña: ${selectedStaff?.email ?? ''}`}
      >
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-slate-400">
            Asigna una nueva clave temporal. Las sesiones activas de este usuario se cerrarán
            inmediatamente y se le pedirá cambiarla al ingresar.
          </p>
          <Input
            label="Nueva contraseña temporal"
            name="password"
            type="text"
            placeholder="Mínimo 6 caracteres"
            value={resetPasswordVal}
            onChange={(e) => setResetPasswordVal(e.target.value)}
            required
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setResetModalOpen(false);
                setSelectedStaff(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? 'Guardando…' : 'Asignar clave'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog Confirmar Activación / Desactivación */}
      <ConfirmDialog
        open={confirmToggleUser !== null}
        title={confirmToggleUser?.active ? 'Desactivar personal' : 'Activar personal'}
        message={
          confirmToggleUser?.active
            ? `¿Estás seguro de desactivar a ${confirmToggleUser.email}? No podrá iniciar sesión y sus sesiones activas serán revocadas.`
            : `¿Deseas reactivar el acceso para ${confirmToggleUser?.email}?`
        }
        confirmLabel={confirmToggleUser?.active ? 'Desactivar' : 'Activar'}
        onConfirm={() => {
          if (confirmToggleUser) {
            toggleStatusMutation.mutate({
              id: confirmToggleUser.id,
              active: !confirmToggleUser.active,
            });
          }
        }}
        onCancel={() => setConfirmToggleUser(null)}
      />
    </div>
  );
}
