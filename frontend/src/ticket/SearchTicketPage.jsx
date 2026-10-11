import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Ticket,
  Smartphone,
  Search,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import Navbar from '../Components/Navbar/NavBar.jsx';
import Footer from '../Components/Footer.jsx';
import { ticketApi } from './api/ticketApi.js';

export default function SearchTicketPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCodigo = codigo.trim();
    const cleanPhone = telefono.replace(/\D/g, '');

    if (!cleanCodigo) {
      setError('Por favor ingresa tu número de ticket (ej. AT-000002).');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Por favor ingresa un número de celular válido registrado (ej. 987123456).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Small artificial delay for pleasant feedback transition if network is instant
      const [res] = await Promise.all([
        ticketApi.lookupPublicTicket({ codigo: cleanCodigo, telefono: cleanPhone }),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);

      if (res?.publicToken) {
        navigate(`/ticket/${res.publicToken}`);
      } else {
        setError('No se pudo localizar el enlace del ticket. Intenta nuevamente.');
      }
    } catch (err) {
      setError(
        err?.message ||
          'No encontramos ninguna orden de servicio con esos datos. Verifica el número de ticket y celular ingresados.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-orange-500 selection:text-white">
      <Helmet>
        <title>Consultar Estado de Ticket · ArmalyTech</title>
        <meta
          name="description"
          content="Consulta en tiempo real el estado de reparación de tu celular o equipo en ArmalyTech con tu número de ticket y celular."
        />
      </Helmet>

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-xl relative z-10">
         

          {/* Card */}
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/70 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2.5">
                Consulta el estado de tu equipo
              </h1>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-md mx-auto">
                Ingresa el código de tu ticket y tu celular registrado para conocer el avance de tu reparación.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">No encontramos coincidencias</p>
                  <p className="mt-0.5 text-xs text-red-200/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Ticket code */}
              <div>
                <label htmlFor="ticket-codigo" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Número de Ticket <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Ticket size={18} />
                  </div>
                  <input
                    id="ticket-codigo"
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej. AT-000002"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-gray-950/70 border border-gray-700/80 rounded-xl text-white placeholder-gray-500 font-mono text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Lo encuentras en la parte superior de tu comprobante de servicio.
                </p>
              </div>

              {/* Field 2: Phone number */}
              <div>
                <label htmlFor="ticket-telefono" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Número de Celular Registrado <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Smartphone size={18} />
                  </div>
                  <input
                    id="ticket-telefono"
                    type="tel"
                    inputMode="numeric"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 987123456"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-gray-950/70 border border-gray-700/80 rounded-xl text-white placeholder-gray-500 font-mono text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  El mismo número con el que dejaste tu equipo en el servicio técnico.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Buscando orden de servicio…</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>Consultar estado</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Privacy notice */}
            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Tus datos están protegidos y solo tú puedes ver el avance de tu equipo.
              </p>
            </div>
          </div>

          {/* Help box */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-gray-800/80 bg-gray-900/40 text-xs text-gray-400">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={16} className="text-orange-400 shrink-0" />
              <span>¿No recuerdas tu número de ticket o necesitas ayuda?</span>
            </div>
            <a
              href="https://api.whatsapp.com/send/?phone=%2B51924548268&text=Hola%20ArmalyTech,%20necesito%20consultar%20el%20estado%20de%20mi%20equipo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition shrink-0"
            >
              <MessageCircle size={14} />
              <span>Escríbenos por WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
