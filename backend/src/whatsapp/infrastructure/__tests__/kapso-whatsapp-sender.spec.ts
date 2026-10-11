import {
  KapsoWhatsAppSender,
  DEFAULT_KAPSO_API_BASE_URL,
} from '../kapso-whatsapp-sender';
import { NoopWhatsAppSender } from '../noop-whatsapp-sender';
import { createWhatsAppSender } from '../whatsapp-sender.factory';
import {
  WhatsAppNotConfiguredError,
  WhatsAppSendError,
} from '../../domain/whatsapp-sender.port';
import { ConfigService } from '@nestjs/config';

function response(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

const input = {
  to: '51987654321',
  template: 'ticket_listo',
  languageCode: 'es',
  bodyParams: ['Andrea', 'Samsung A53', 'AT-000001'],
  urlButton: { index: 1, param: 'token-123' },
};

describe('KapsoWhatsAppSender', () => {
  const config = { apiKey: 'secret-key', phoneNumberId: '961761267022319' };

  it('posts the template payload with the X-API-Key header and returns the wamid', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response(200, { messages: [{ id: 'wamid.ABC' }] }));
    const sender = new KapsoWhatsAppSender(config, fetchMock);

    await expect(sender.sendTemplate(input)).resolves.toEqual({
      wamid: 'wamid.ABC',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DEFAULT_KAPSO_API_BASE_URL}/961761267022319/messages`);
    expect(init.method).toBe('POST');
    expect(init.headers['X-API-Key']).toBe('secret-key');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '51987654321',
      type: 'template',
      template: {
        name: 'ticket_listo',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Andrea' },
              { type: 'text', text: 'Samsung A53' },
              { type: 'text', text: 'AT-000001' },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '1',
            parameters: [{ type: 'text', text: 'token-123' }],
          },
        ],
      },
    });
  });

  it('sends only the body component when there is no URL button, honoring a custom base URL', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response(200, { messages: [{ id: 'wamid.X' }] }));
    const sender = new KapsoWhatsAppSender(
      { ...config, baseUrl: 'https://example.test/v1/' },
      fetchMock,
    );

    await sender.sendTemplate({
      to: '51987654321',
      template: 'resena_google',
      languageCode: 'es',
      bodyParams: ['Andrea'],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.test/v1/961761267022319/messages');
    expect(JSON.parse(init.body).template.components).toEqual([
      { type: 'body', parameters: [{ type: 'text', text: 'Andrea' }] },
    ]);
  });

  it('maps a Meta error body into WhatsAppSendError', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response(400, {
        error: {
          message: '(#132000) Number of parameters does not match',
          type: 'OAuthException',
          code: 132000,
          error_data: {
            messaging_product: 'whatsapp',
            details: 'body: number of localizable_params (2) does not match',
          },
        },
      }),
    );
    const sender = new KapsoWhatsAppSender(config, fetchMock);

    const error = await sender.sendTemplate(input).catch((e) => e);

    expect(error).toBeInstanceOf(WhatsAppSendError);
    expect(error.code).toBe('132000');
    expect(error.title).toBe('OAuthException');
    expect(error.message).toContain('Number of parameters does not match');
    expect(error.message).toContain('localizable_params');
    expect(error.message).not.toContain('secret-key');
  });

  it('handles a plain-string error and an unparsable error body', async () => {
    const sender = new KapsoWhatsAppSender(
      config,
      jest
        .fn()
        .mockResolvedValueOnce(response(401, { error: 'Invalid API key' }))
        .mockResolvedValueOnce(response(502, '<html>bad gateway</html>')),
    );

    await expect(sender.sendTemplate(input)).rejects.toMatchObject({
      message: 'Invalid API key',
      code: '401',
    });
    await expect(sender.sendTemplate(input)).rejects.toMatchObject({
      message: 'Kapso responded with HTTP 502',
      code: '502',
    });
  });

  it('fails when a 2xx response has no message id', async () => {
    const sender = new KapsoWhatsAppSender(
      config,
      jest.fn().mockResolvedValue(response(200, { messages: [] })),
    );
    await expect(sender.sendTemplate(input)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('wraps network failures', async () => {
    const sender = new KapsoWhatsAppSender(
      config,
      jest.fn().mockRejectedValue(new Error('ECONNRESET')),
    );
    const error = await sender.sendTemplate(input).catch((e) => e);
    expect(error).toBeInstanceOf(WhatsAppSendError);
    expect(error.code).toBe('network_error');
    expect(error.message).toContain('ECONNRESET');
  });

  it('aborts the request after the timeout', async () => {
    const fetchMock = jest.fn(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new Error('The operation was aborted')),
          );
        }),
    );
    const sender = new KapsoWhatsAppSender(
      { ...config, timeoutMs: 20 },
      fetchMock as never,
    );

    const error = await sender.sendTemplate(input).catch((e) => e);

    expect(error).toBeInstanceOf(WhatsAppSendError);
    expect(error.code).toBe('timeout');
  });
});

describe('createWhatsAppSender', () => {
  const configWith = (values: Record<string, string>) =>
    ({ get: (key: string) => values[key] }) as unknown as ConfigService;

  it('uses Kapso only when both credentials are set', () => {
    expect(
      createWhatsAppSender(
        configWith({ KAPSO_API_KEY: 'k', KAPSO_PHONE_NUMBER_ID: '1' }),
      ),
    ).toBeInstanceOf(KapsoWhatsAppSender);
    expect(
      createWhatsAppSender(configWith({ KAPSO_API_KEY: 'k' })),
    ).toBeInstanceOf(NoopWhatsAppSender);
    expect(
      createWhatsAppSender(configWith({ KAPSO_PHONE_NUMBER_ID: '1' })),
    ).toBeInstanceOf(NoopWhatsAppSender);
    expect(
      createWhatsAppSender(
        configWith({ KAPSO_API_KEY: '  ', KAPSO_PHONE_NUMBER_ID: '1' }),
      ),
    ).toBeInstanceOf(NoopWhatsAppSender);
  });

  it('the Noop sender fails with a not-configured error', async () => {
    await expect(
      new NoopWhatsAppSender().sendTemplate(),
    ).rejects.toBeInstanceOf(WhatsAppNotConfiguredError);
  });
});
