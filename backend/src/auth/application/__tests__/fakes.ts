import { Admin } from '../../domain/admin.entity';
import { AdminRepository } from '../../domain/admin-repository.port';
import { PasswordHasher } from '../../domain/password-hasher.port';

export class FakeAdminRepository implements AdminRepository {
  private admins: Admin[] = [];
  private idSeq = 1;

  async count(): Promise<number> {
    return this.admins.length;
  }

  async create(username: string, passwordHash: string): Promise<Admin> {
    const admin: Admin = {
      id: String(this.idSeq++),
      username,
      passwordHash,
      createdAt: new Date(),
    };
    this.admins.push(admin);
    return admin;
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.admins.find((a) => a.username === username) ?? null;
  }

  async findById(id: string): Promise<Admin | null> {
    return this.admins.find((a) => a.id === id) ?? null;
  }

  seed(admin: Admin): void {
    this.admins.push(admin);
  }
}

/** Trivial reversible "hash" so tests can assert without real bcrypt cost. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
