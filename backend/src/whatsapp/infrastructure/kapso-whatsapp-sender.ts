import {
  SendTemplateInput,
  SendTemplateResult,
  WhatsAppSender,
  WhatsAppSendError,
} from '../domain/whatsapp-sender.port';

export const DEFAULT_KAPSO_API_BASE_URL =
  'https://api.kapso.ai/meta/whatsapp/v24.0';

export interface KapsoSenderConfig {
  apiKey: string;
  phoneNumberId: string;
  baseUrl?: string;
  timeoutMs?: number;
}

type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

/**
 * Sends WhatsApp templates through Kapso's proxy of the Meta Cloud API
 * (ADR 0029). Uses the runtime's global `fetch`; the API key is only ever
 * sent in the `X-API-Key` header and never logged or put in error messages.
 */
export class KapsoWhatsAppSender implements WhatsAppSender {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: KapsoSenderConfig,
    private readonly fetchImpl: FetchLike = globalThis.fetch as FetchLike,
  ) {
    this.baseUrl = (config.baseUrl || DEFAULT_KAPSO_API_BASE_URL).replace(
      /\/+$/,
      '',
    );
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  async sendTemplate(input: SendTemplateInput): Promise<SendTemplateResult> {
    const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let status: number;
    let rawBody: string;
    let ok: boolean;
    try {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(this.buildPayload(input)),
        signal: controller.signal,
      });
      ok = res.ok;
      status = res.status;
      rawBody = await res.text();
    } catch (error) {
      if (controller.signal.aborted) {
        throw new WhatsAppSendError(
          `Kapso did not respond within ${this.timeoutMs} ms`,
          'timeout',
        );
      }
      throw new WhatsAppSendError(
        `Could not reach Kapso: ${error instanceof Error ? error.message : 'unknown error'}`,
        'network_error',
      );
    } finally {
      clearTimeout(timer);
    }

    const body = parseJson(rawBody);

    if (!ok) {
      throw this.toSendError(body, status);
    }

    const wamid = firstMessageId(body);
    if (!wamid) {
      throw new WhatsAppSendError(
        'Kapso accepted the request but returned no message id',
        'invalid_response',
      );
    }
    return { wamid };
  }

  private buildPayload(input: SendTemplateInput) {
    const components: unknown[] = [];
    if (input.bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: input.bodyParams.map((text) => ({ type: 'text', text })),
      });
    }
    if (input.urlButton) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: String(input.urlButton.index),
        parameters: [{ type: 'text', text: input.urlButton.param }],
      });
    }
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'template',
      template: {
        name: input.template,
        language: { code: input.languageCode },
        components,
      },
    };
  }

  /** Maps a Meta/Kapso error body (`error.{code,message,error_data}`). */
  private toSendError(body: unknown, status: number): WhatsAppSendError {
    const root = asRecord(body);
    const err = root?.error;

    if (typeof err === 'string' && err) {
      return new WhatsAppSendError(err, String(status));
    }

    const e = asRecord(err);
    if (e) {
      const details = asRecord(e.error_data)?.details;
      const base = typeof e.message === 'string' ? e.message : '';
      const detailText = typeof details === 'string' ? details : '';
      const message =
        [base, detailText && detailText !== base ? `(${detailText})` : '']
          .filter(Boolean)
          .join(' ') || `Kapso responded with HTTP ${status}`;
      const code = e.code !== undefined ? String(e.code) : String(status);
      const rawTitle = e.error_user_title ?? e.type;
      return new WhatsAppSendError(
        message,
        code,
        typeof rawTitle === 'string' ? rawTitle : undefined,
      );
    }

    return new WhatsAppSendError(
      `Kapso responded with HTTP ${status}`,
      String(status),
    );
  }
}

function parseJson(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function firstMessageId(body: unknown): string | undefined {
  const messages = asRecord(body)?.messages;
  if (!Array.isArray(messages)) return undefined;
  const id = asRecord(messages[0])?.id;
  return typeof id === 'string' && id ? id : undefined;
}
