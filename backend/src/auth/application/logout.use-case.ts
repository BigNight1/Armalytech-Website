import { Inject, Injectable } from '@nestjs/common';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../domain/user-repository.port';

/**
 * Revokes every session of a user by bumping `tokenVersion` (2026-10-25
 * hardening, C1). `SessionGuard` already compares the token's `tokenVersion`
 * against the stored one, so a bump is what turns a copied cookie from "valid
 * for the remaining 12 h" into "dead on the next request".
 *
 * Idempotent and silent: a missing/unknown `userId` is a no-op instead of an
 * error, so the public logout route can call it unconditionally and always
 * answer `200 { ok: true }` without revealing whether a session existed.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId?: string): Promise<void> {
    if (!userId) {
      return;
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return;
    }

    await this.userRepository.update(user.id, {
      tokenVersion: user.tokenVersion + 1,
    });
  }
}
