import { ConfigService } from '@nestjs/config';
import { WhatsAppSender } from '../domain/whatsapp-sender.port';
import { KapsoWhatsAppSender } from './kapso-whatsapp-sender';
import { NoopWhatsAppSender } from './noop-whatsapp-sender';

/**
 * Picks the real Kapso adapter when both `KAPSO_API_KEY` and
 * `KAPSO_PHONE_NUMBER_ID` are set; otherwise the Noop adapter, so the rest
 * of the backend boots normally without WhatsApp credentials.
 */
export function createWhatsAppSender(config: ConfigService): WhatsAppSender {
  const apiKey = config.get<string>('KAPSO_API_KEY')?.trim();
  const phoneNumberId = config.get<string>('KAPSO_PHONE_NUMBER_ID')?.trim();
  if (!apiKey || !phoneNumberId) {
    return new NoopWhatsAppSender();
  }
  return new KapsoWhatsAppSender({
    apiKey,
    phoneNumberId,
    baseUrl: config.get<string>('KAPSO_API_BASE_URL')?.trim() || undefined,
  });
}
