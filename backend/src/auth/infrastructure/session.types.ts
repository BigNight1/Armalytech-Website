import { UserRole } from '../domain/user.entity';

export interface SessionPayload {
  sub: string;
  email: string;
  username?: string;
  role: UserRole;
  tokenVersion: number;
  mustChangePassword?: boolean;
  iat?: number;
  exp?: number;
}

export const SESSION_COOKIE_NAME = 'armalytech_session';
