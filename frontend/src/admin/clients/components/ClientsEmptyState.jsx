import { useState } from 'react';
import { Button, EmptyState } from '../../shared/ui/index.js';

const REGISTER_PATH = '/registrar/usuario';

const STEPS = [
  { step: '1', label: 'Escanea QR/NFC' },
  { step: '2', label: 'Completa el formulario' },
  { step: '3', label: 'Aparece aquí' },
];

/**
 * Friendly empty state for the Clientes table: explains where clients come
 * from, and gives a quick way to copy/open the public registration link
 * (useful to test the QR/NFC flow without a physical code at hand).
 */
export default function ClientsEmptyState() {
  const [copied, setCopied] = useState(false);
  const registerUrl = `${window.location.origin}${REGISTER_PATH}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context);
      // the link is still visible/openable, so this is a soft failure.
    }
  }

  return (
    <EmptyState
      title="Aún no hay clientes registrados"
      description="Los clientes aparecen aquí en cuanto escanean el QR o NFC del local y completan el formulario de registro."
      action={
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? 'Enlace copiado' : 'Copiar enlace de registro'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.open(registerUrl, '_blank', 'noopener')}
            >
              Abrir en una pestaña nueva
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            {STEPS.map((item, index) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange/20 font-semibold text-brand-orange">
                    {item.step}
                  </span>
                  <span>{item.label}</span>
                </div>
                {index < STEPS.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
