/**
 * Thin fetch wrapper for the admin panel (ADR 0004 / ADR 0010): sends the
 * session cookie on every call, unwraps the backend's uniform JSON envelope
 * (`{ ok: true, data }` / `{ ok: false, error }`), and normalizes failures
 * into `ApiError`.
 */

const API_BASE_URL = '/api';

/** Error shape mirroring the backend's `HttpExceptionFilter` error body. */
export class ApiError extends Error {
  constructor({ status, code, message }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let unauthorizedHandler = null;

/** Registers a single callback invoked whenever a request receives a 401. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

function normalizeMessage(message) {
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return message ?? 'Ocurrió un error inesperado';
}

async function request(path, { method = 'GET', body, headers, skipUnauthorizedHandler = false } = {}) {
  const hasBody = body !== undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorBody = payload?.error;
    const apiError = new ApiError({
      status: response.status,
      code: errorBody?.code ?? 'unknown_error',
      message: normalizeMessage(errorBody?.message),
    });

    if (response.status === 401 && !skipUnauthorizedHandler && unauthorizedHandler) {
      unauthorizedHandler(apiError);
    }

    throw apiError;
  }

  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
