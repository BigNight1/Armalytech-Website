export interface SessionPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = 'armalytech_session';
