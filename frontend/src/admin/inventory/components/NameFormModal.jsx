import { useEffect, useState } from 'react';
import { Modal, Button, Input } from '../../shared/ui/index.js';

/**
 * Generic "create/edit by name" modal, shared by brands and models (both
 * are a single required name field). Presentational only — `onSubmit`
 * does the actual API call; this component just manages the text field
 * and surfaces its own submit state/errors.
 */
export default function NameFormModal({
  open,
  title,
  label,
  placeholder,
  initialName = '',
  submitLabel = 'Guardar',
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(null);
    }
  }, [open, initialName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="name-form-modal" disabled={isSubmitting || !name.trim()}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="name-form-modal" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label={label}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={placeholder}
          error={error}
          autoFocus
        />
      </form>
    </Modal>
  );
}
