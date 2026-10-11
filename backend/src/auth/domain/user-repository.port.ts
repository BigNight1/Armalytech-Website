import { User, UserRole } from './user.entity';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  active?: boolean;
  tokenVersion?: number;
  mustChangePassword?: boolean;
  createdBy?: string | null;
}

export interface UpdateUserInput {
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  active?: boolean;
  tokenVersion?: number;
  mustChangePassword?: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  count(): Promise<number>;
  countActiveOwners(): Promise<number>;
  findAll(): Promise<User[]>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
