import { Inject, Injectable } from '@nestjs/common';
import { Admin } from '../domain/admin.entity';
import {
  AdminRepository,
  ADMIN_REPOSITORY,
} from '../domain/admin-repository.port';
import {
  PasswordHasher,
  PASSWORD_HASHER,
} from '../domain/password-hasher.port';
import { InvalidCredentialsError } from '../domain/auth.errors';

export interface LoginInput {
  username: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepository: AdminRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<Admin> {
    const admin = await this.adminRepository.findByUsername(input.username);
    if (!admin) {
      throw new InvalidCredentialsError();
    }

    const matches = await this.passwordHasher.compare(
      input.password,
      admin.passwordHash,
    );
    if (!matches) {
      throw new InvalidCredentialsError();
    }

    return admin;
  }
}
