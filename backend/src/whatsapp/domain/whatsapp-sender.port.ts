export const WHATSAPP_SENDER = Symbol('WHATSAPP_SENDER');

export interface SendTemplateInput {
  /** Destination in E.164 without the leading `+` (e.g. `51987654321`). */
  to: string;
  template: string;
  languageCode: string;
  /** Positional body parameters, already sanitized. */
  bodyParams: string[];
  /** Dynamic URL button: its position in the template and the URL suffix. */
  urlButton?: { index: number; param: string };
}

export interface SendTemplateResult {
  /** WhatsApp message id (`wamid...`) returned by the provider. */
  wamid: string;
}

export interface WhatsAppSender {
  /** Sends an approved template. Throws `WhatsAppSendError` on any failure. */
  sendTemplate(input: SendTemplateInput): Promise<SendTemplateResult>;
}

/** Normalized failure of a send attempt (provider error, timeout, network). */
export class WhatsAppSendError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly title?: string,
  ) {
    super(message);
    this.name = 'WhatsAppSendError';
  }
}

/** The adapter has no credentials: nothing was sent and nothing is persisted. */
export class WhatsAppNotConfiguredError extends WhatsAppSendError {
  constructor() {
    super('WhatsApp is not configured (missing Kapso credentials)');
    this.name = 'WhatsAppNotConfiguredError';
  }
}
