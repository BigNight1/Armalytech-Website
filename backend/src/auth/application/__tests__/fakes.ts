import { User } from '../../domain/user.entity';
import {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from '../../domain/user-repository.port';
import { PasswordHasher } from '../../domain/password-hasher.port';

export class FakeUserRepository implements UserRepository {
  private users: User[] = [];
  private idSeq = 1;

  async count(): Promise<number> {
    return this.users.length;
  }

  async countActiveOwners(): Promise<number> {
    return this.users.filter((u) => u.role === 'owner' && u.active).length;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async create(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: String(this.idSeq++),
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      role: input.role,
      active: input.active ?? true,
      tokenVersion: input.tokenVersion ?? 0,
      mustChangePassword: input.mustChangePassword ?? false,
      createdBy: input.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    if (input.email !== undefined)
      user.email = input.email.toLowerCase().trim();
    if (input.passwordHash !== undefined)
      user.passwordHash = input.passwordHash;
    if (input.role !== undefined) user.role = input.role;
    if (input.active !== undefined) user.active = input.active;
    if (input.tokenVersion !== undefined)
      user.tokenVersion = input.tokenVersion;
    if (input.mustChangePassword !== undefined)
      user.mustChangePassword = input.mustChangePassword;
    user.updatedAt = new Date();
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    return (
      this.users.find(
        (u) =>
          u.email === normalized || u.email === `${normalized}@armalytech.com`,
      ) ?? null
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  seed(user: Partial<User> & { email: string; passwordHash: string }): User {
    const fullUser: User = {
      id: user.id ?? String(this.idSeq++),
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role ?? 'owner',
      active: user.active ?? true,
      tokenVersion: user.tokenVersion ?? 0,
      mustChangePassword: user.mustChangePassword ?? false,
      createdBy: user.createdBy ?? null,
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
    };
    this.users.push(fullUser);
    return fullUser;
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
