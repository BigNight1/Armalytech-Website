import { FiAlertCircle, FiCheck, FiLoader } from 'react-icons/fi';

const CONFIG = {
  saving: { icon: FiLoader, className: 'text-slate-400 animate-spin', label: 'Guardando…' },
  saved: { icon: FiCheck, className: 'text-green-400', label: 'Guardado' },
  error: { icon: FiAlertCircle, className: 'text-red-400', label: 'Error al guardar, click para reintentar' },
};

/** Small per-row save indicator: saving spinner, saved check, or error mark. */
export default function RowStatusDot({ status, onRetry }) {
  const entry = CONFIG[status];
  if (!entry) return <span className="inline-block h-3.5 w-3.5" aria-hidden="true" />;

  const Icon = entry.icon;
  const content = <Icon size={14} className={entry.className} />;

  if (status === 'error') {
    return (
      <button type="button" onClick={onRetry} title={entry.label} aria-label={entry.label} className="inline-flex">
        {content}
      </button>
    );
  }

  return (
    <span title={entry.label} aria-label={entry.label}>
      {content}
    </span>
  );
}
