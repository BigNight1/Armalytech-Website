import { Admin } from './admin.entity';

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export interface AdminRepository {
  count(): Promise<number>;
  create(username: string, passwordHash: string): Promise<Admin>;
  findByUsername(username: string): Promise<Admin | null>;
  findById(id: string): Promise<Admin | null>;
}
