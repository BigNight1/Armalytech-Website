import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AdminRepository,
  ADMIN_REPOSITORY,
} from '../domain/admin-repository.port';
import {
  PasswordHasher,
  PASSWORD_HASHER,
} from '../domain/password-hasher.port';

export interface BootstrapAdminInput {
  username?: string;
  password?: string;
}

/**
 * Creates the single admin account from env-provided credentials the first
 * time the admin collection is empty (ADR 0004). No-op on every later run.
 */
@Injectable()
export class BootstrapAdminUseCase {
  private readonly logger = new Logger(BootstrapAdminUseCase.name);

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepository: AdminRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapAdminInput): Promise<void> {
    const existingCount = await this.adminRepository.count();
    if (existingCount > 0) {
      return;
    }

    if (!input.username || !input.password) {
      this.logger.warn(
        'No admin account exists and ADMIN_USERNAME/ADMIN_PASSWORD are not set; skipping bootstrap.',
      );
      return;
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.adminRepository.create(input.username, passwordHash);
    this.logger.log(`Bootstrapped admin account "${input.username}".`);
  }
}
