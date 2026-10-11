import {
  SendTemplateResult,
  WhatsAppNotConfiguredError,
  WhatsAppSender,
} from '../domain/whatsapp-sender.port';

/** Used when Kapso credentials are missing: the app boots, sends fail fast. */
export class NoopWhatsAppSender implements WhatsAppSender {
  async sendTemplate(): Promise<SendTemplateResult> {
    throw new WhatsAppNotConfiguredError();
  }
}
