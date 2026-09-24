import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { communityApi } from './api/communityApi.js';
import { isValidPeruvianPhone } from './lib/phone.js';
import { ApiError } from '../admin/shared/api/httpClient.js';

/**
 * Public QR/NFC landing page (ADR 0012-0015): no NavBar/Footer/WhatsApp
 * widget — a physical code inside the store points straight here, and the
 * canal (qr|nfc) travels as a query param, e.g. `/registrar/usuario?canal=nfc`.
 */
export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const channel = searchParams.get('canal') === 'nfc' ? 'nfc' : 'qr';

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', marketingConsent: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const phoneIsValid = useMemo(
    () => form.phone.trim() === '' || isValidPeruvianPhone(form.phone),
    [form.phone],
  );

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'Ingresa tu nombre';
    if (!form.lastName.trim()) nextErrors.lastName = 'Ingresa tu apellido';
    if (!isValidPeruvianPhone(form.phone)) {
      nextErrors.phone = 'Ingresa un número de WhatsApp peruano válido (ej. 965 728 013)';
    }
    if (!form.marketingConsent) {
      nextErrors.marketingConsent = 'Debes aceptar para poder registrarte';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setSubmitError('');
    try {
      const data = await communityApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        marketingConsent: form.marketingConsent,
        channel,
      });
      setResult(data);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiError && error.code === 'validation_error') {
        setSubmitError('Revisa tus datos: ' + error.message);
      } else {
        setSubmitError('No pudimos completar tu registro. Intenta nuevamente en unos minutos.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center px-4 py-10">
      <Helmet>
        <title>Únete a la comunidad ArmalyTech</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <img
        src="/ArmalyTechlogopeq.webp"
        alt="ArmalyTech"
        className="w-20 h-20 object-contain mb-4"
      />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        {status === 'success' ? (
          <SuccessState result={result} />
        ) : (
          <>
            <h1 className="text-xl font-bold text-brand-navy text-center mb-1">
              Únete a la comunidad ArmalyTech
            </h1>
            <p className="text-sm text-slate-500 text-center mb-6">
              Regístrate y entérate primero de nuestras promociones.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field
                id="firstName"
                label="Nombre"
                value={form.firstName}
                onChange={(v) => updateField('firstName', v)}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <Field
                id="lastName"
                label="Apellido"
                value={form.lastName}
                onChange={(v) => updateField('lastName', v)}
                error={errors.lastName}
                autoComplete="family-name"
              />
              <Field
                id="phone"
                label="Número de WhatsApp"
                value={form.phone}
                onChange={(v) => updateField('phone', v)}
                error={errors.phone}
                placeholder="965 728 013"
                inputMode="tel"
                autoComplete="tel"
                hint={!phoneIsValid && form.phone.trim() !== '' ? 'Formato no reconocido' : undefined}
              />

              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                  checked={form.marketingConsent}
                  onChange={(e) => updateField('marketingConsent', e.target.checked)}
                />
                <span>Acepto recibir ofertas y promociones por WhatsApp.</span>
              </label>
              {errors.marketingConsent && (
                <p className="text-xs text-red-600 -mt-2">{errors.marketingConsent}</p>
              )}

              {status === 'error' && submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full rounded-lg bg-brand-orange text-white font-semibold py-2.5 hover:bg-brand-orange-600 disabled:opacity-60 transition"
              >
                {status === 'submitting' ? 'Enviando…' : 'Registrarme'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, error, hint, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-brand-orange/50'
        }`}
        {...inputProps}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function SuccessState({ result }) {
  const isNew = result?.isNewClient;
  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl">
        ✓
      </div>
      <h2 className="text-lg font-bold text-brand-navy mb-1">
        {isNew ? '¡Registrado!' : '¡Gracias por volver!'}
      </h2>
      <p className="text-sm text-slate-500">
        {isNew
          ? 'Ya formas parte de la comunidad ArmalyTech.'
          : `Visita #${result?.visitCount ?? ''}`}
      </p>
    </div>
  );
}
