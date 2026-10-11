import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { communityApi } from './api/communityApi.js';
import LoyaltyCard from './components/LoyaltyCard.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import RegisterResult from './components/RegisterResult.jsx';
import { ApiError } from '../admin/shared/api/httpClient.js';

const EMPTY_VALUES = { firstName: '', lastName: '', phone: '', consent: false };

const GENERIC_ERROR =
  'No pudimos completar tu registro. Intenta nuevamente en unos minutos.';

/**
 * Public QR/NFC landing page (ADR 0012-0015, updated 2026-09-25 for optional
 * consent): no NavBar/Footer/WhatsApp widget — a physical code inside the
 * store points straight here, and the canal (qr|nfc) travels as a query
 * param, e.g. `/registrar/usuario?canal=nfc`.
 *
 * Visual source of truth: `design/Rediseño de registro de usuario/Panel
 * Admin Rediseño.dc.html`, `/registrar/usuario` board (`regScreen()` /
 * `regScreens()`). Client-side validation mirrors that design exactly; the
 * backend remains the source of truth and its errors surface on submit.
 */
export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const channel = searchParams.get('canal') === 'nfc' ? 'nfc' : 'qr';

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { client, isNewClient } once done

  function updateField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError('');
  }

  function validate() {
    const digits = values.phone.replace(/\D/g, '');
    return {
      firstName: values.firstName.trim() ? '' : 'Ingresa tu nombre',
      lastName: values.lastName.trim() ? '' : 'Ingresa tu apellido',
      phone: /^9\d{8}$/.test(digits) ? '' : 'Debe tener 9 dígitos y empezar con 9',
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    if (nextErrors.firstName || nextErrors.lastName || nextErrors.phone) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError('');
    setBusy(true);
    try {
      const digits = values.phone.replace(/\D/g, '');
      const data = await communityApi.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: digits,
        marketingConsent: values.consent,
        channel,
      });
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'validation_error') {
        // The only backend rejection left on this endpoint is an invalid
        // phone number (ADR 0015 update, 2026-09-25) — name fields are
        // already validated client-side with the same rule as the DTO.
        setErrors({ phone: 'Debe tener 9 dígitos y empezar con 9' });
      } else {
        setSubmitError(GENERIC_ERROR);
      }
    } finally {
      setBusy(false);
    }
  }

  const bannerText = errors.firstName || errors.lastName || errors.phone
    ? 'Revisa los campos marcados.'
    : submitError;

  const done = !!result;
  const isNewClient = result?.isNewClient;
  const firstName = result?.client?.firstName || values.firstName.trim();
  const stamps = result?.client?.stamps ?? 0;

  const card = done
    ? isNewClient
      ? { stamps: 0, tagActive: true, tagLabel: 'Activa · 0/5', footText: 'Tu primer sello llega en tu próxima visita.' }
      : {
          stamps,
          tagActive: true,
          tagLabel: `${stamps}/5`,
          footText: `Te faltan ${5 - stamps} visitas para tu 20% de descuento.`,
        }
    : { stamps: 0, tagActive: false, tagLabel: '0/5', footText: 'Un sello por cada visita o reparación en tienda.' };

  const resultCopy = isNewClient
    ? {
        kicker: 'Registro completo',
        title: `¡Listo, ${firstName}! Ya eres parte de ArmalyTech Club.`,
        text: 'Tu tarjeta está activa. Tu primer sello llega en tu próxima visita a la tienda.',
      }
    : {
        kicker: 'Ya eres parte del club',
        title: `¡Hola de nuevo, ${firstName}!`,
        text: 'Este número ya está registrado. No necesitas hacer nada más: sigue sumando sellos en cada visita.',
      };

  return (
    <div className="min-h-screen bg-brand-navy font-archivo text-brand-ink">
      <Helmet>
        <title>Únete a la comunidad ArmalyTech</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        <header className="flex h-16 flex-none items-center gap-2.5 border-b-2 border-brand-ink/[0.12] px-5">
          <img
            src="/Armalytech_logo.png"
            alt="ArmalyTech"
            className="h-[34px] w-[34px] object-contain"
          />
          <span className="text-[17px] font-extrabold text-white">ArmalyTech</span>
          <span className="ml-auto text-[13px] font-bold uppercase tracking-widest text-brand-orange-300">
            Club
          </span>
        </header>

        <main className="flex flex-1 flex-col gap-[22px] px-5 pb-7 pt-6">
          <LoyaltyCard
            stamps={card.stamps}
            tagLabel={card.tagLabel}
            tagActive={card.tagActive}
            footText={card.footText}
          />

          {done ? (
            <RegisterResult {...resultCopy} />
          ) : (
            <RegisterForm
              values={values}
              errors={errors}
              bannerText={bannerText}
              busy={busy}
              onChange={updateField}
              onSubmit={handleSubmit}
            />
          )}
        </main>
      </div>
    </div>
  );
}
