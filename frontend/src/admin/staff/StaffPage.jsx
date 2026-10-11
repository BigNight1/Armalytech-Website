import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus } from 'lucide-react';
import { staffApi } from './api/staffApi.js';
import { useAuth } from '../auth/useAuth.js';
import { useToast, Button, Input, Modal, ConfirmDialog, SkeletonTable, Tag } from '../shared/ui/index.js';

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
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[680px] flex-col gap-1.5">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent-ink">Administración</span>
          <h1>Personal del panel</h1>
          <p className="mt-1 text-base text-muted">
            Gestiona los accesos del equipo, crea credenciales temporales o desactiva usuarios.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus size={18} strokeWidth={2.2} />
          <span>Nuevo personal</span>
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} columns={6} />
      ) : (
        <div className="overflow-x-auto border-t-2 border-ink">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Correo electrónico</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado por</th>
                <th className="whitespace-nowrap">Registro</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    No hay personal registrado aún.
                  </td>
                </tr>
              ) : (
                staffList.map((member) => {
                  const isSelf = member.id === user?.id;
                  const initials = (member.email || '')
                    .split('@')[0]
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr key={member.id} className={member.active ? '' : 'opacity-70'}>
                      <td>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex h-9 w-9 flex-none items-center justify-center border border-line bg-surface text-sm font-extrabold text-ink">
                            {initials}
                          </span>
                          <span className="font-bold text-ink">{member.email}</span>
                          {isSelf && <Tag variant="solid">Tú</Tag>}
                          {member.mustChangePassword && (
                            <span className="whitespace-nowrap border border-accent px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-ink">
                              Clave temporal
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Tag variant={member.role === 'owner' ? 'solid' : 'neutral'}>
                          {member.role === 'owner' ? 'Principal (Owner)' : 'Personal (Admin)'}
                        </Tag>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2 font-semibold text-ink">
                          <span className={`h-[9px] w-[9px] ${member.active ? 'bg-ink' : 'bg-danger'}`} />
                          <span>{member.active ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>
                      <td className="text-muted">{member.createdBy ?? 'Sistema (Bootstrap)'}</td>
                      <td className="tabular-nums text-muted">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString('es-PE') : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(member);
                              setResetPasswordVal('');
                              setResetModalOpen(true);
                            }}
                            className="inline-flex h-9 items-center gap-2 whitespace-nowrap border border-line px-3 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent-ink"
                          >
                            <KeyRound size={15} />
                            <span>Resetear clave</span>
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setConfirmToggleUser(member)}
                              className={`h-9 whitespace-nowrap border px-3 text-sm font-bold transition-colors ${
                                member.active
                                  ? 'border-danger text-danger-ink hover:bg-danger-bg'
                                  : 'border-line text-ink hover:border-accent hover:text-accent-ink'
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
        dismissible={false}
        isDirty={newEmail.trim() !== '' || newPassword.trim() !== ''}
      >
        {(requestClose) => (
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <p className="text-[15px] leading-normal text-muted">
              Crea una cuenta con una contraseña temporal. En su primer ingreso, el sistema le exigirá crear su propia
              contraseña privada.
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
            <div className="mt-2 flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="secondary" onClick={requestClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando…' : 'Crear personal'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Resetear Contraseña */}
      <Modal
        open={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setSelectedStaff(null);
        }}
        title={`Resetear contraseña: ${selectedStaff?.email ?? ''}`}
        dismissible={false}
        isDirty={resetPasswordVal.trim() !== ''}
      >
        {(requestClose) => (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            <p className="text-[15px] leading-normal text-muted">
              Asigna una nueva clave temporal. Las sesiones activas de este usuario se cerrarán inmediatamente y se le
              pedirá cambiarla al ingresar.
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
            <div className="mt-2 flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="secondary" onClick={requestClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? 'Guardando…' : 'Asignar clave'}
              </Button>
            </div>
          </form>
        )}
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
        danger={Boolean(confirmToggleUser?.active)}
        loading={toggleStatusMutation.isPending}
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
