export type UserRole = 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  tokenVersion: number;
  mustChangePassword: boolean;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
