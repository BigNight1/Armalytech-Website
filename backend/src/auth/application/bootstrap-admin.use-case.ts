import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../domain/user-repository.port';
import {
  PasswordHasher,
  PASSWORD_HASHER,
} from '../domain/password-hasher.port';

export interface BootstrapAdminInput {
  email?: string;
  username?: string;
  password?: string;
}

/**
 * Creates the initial owner account from env-provided credentials the first
 * time the users collection is empty (ADR 0022).
 */
@Injectable()
export class BootstrapAdminUseCase {
  private readonly logger = new Logger(BootstrapAdminUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapAdminInput): Promise<void> {
    const existingCount = await this.userRepository.count();
    if (existingCount > 0) {
      return;
    }

    const rawIdentifier = input.email || input.username;
    if (!rawIdentifier || !input.password) {
      this.logger.warn(
        'No user account exists and ADMIN_USERNAME/ADMIN_PASSWORD are not set; skipping bootstrap.',
      );
      return;
    }

    const email = rawIdentifier.includes('@')
      ? rawIdentifier
      : `${rawIdentifier}@armalytech.com`;

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.userRepository.create({
      email,
      passwordHash,
      role: 'owner',
      active: true,
      tokenVersion: 0,
      mustChangePassword: false,
    });
    this.logger.log(`Bootstrapped owner account "${email}".`);
  }
}
