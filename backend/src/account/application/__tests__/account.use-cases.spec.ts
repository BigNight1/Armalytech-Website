import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UpdateEmailUseCase, UpdatePasswordUseCase } from '../account.use-cases';
import { FakeUserRepository, FakePasswordHasher } from '../../../auth/application/__tests__/fakes';

describe('Account Use Cases', () => {
  let repository: FakeUserRepository;
  let hasher: FakePasswordHasher;
  let updateEmailUseCase: UpdateEmailUseCase;
  let updatePasswordUseCase: UpdatePasswordUseCase;

  beforeEach(() => {
    repository = new FakeUserRepository();
    hasher = new FakePasswordHasher();
    updateEmailUseCase = new UpdateEmailUseCase(repository, hasher);
    updatePasswordUseCase = new UpdatePasswordUseCase(repository, hasher);
  });

  describe('UpdateEmailUseCase', () => {
    it('updates email when current password matches and email is available', async () => {
      const passwordHash = await hasher.hash('old-password');
      const user = await repository.create({
        email: 'owner@armalytech.com',
        passwordHash,
        role: 'owner',
      });

      const updated = await updateEmailUseCase.execute(user.id, {
        currentPassword: 'old-password',
        newEmail: 'newowner@armalytech.com',
      });

      expect(updated.email).toBe('newowner@armalytech.com');
      expect(updated.tokenVersion).toBe(1);
    });

    it('rejects when current password is wrong', async () => {
      const passwordHash = await hasher.hash('old-password');
      const user = await repository.create({
        email: 'owner@armalytech.com',
        passwordHash,
        role: 'owner',
      });

      await expect(
        updateEmailUseCase.execute(user.id, {
          currentPassword: 'wrong-password',
          newEmail: 'newowner@armalytech.com',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when new email is already taken by another user', async () => {
      const passwordHash = await hasher.hash('password');
      const user1 = await repository.create({
        email: 'user1@armalytech.com',
        passwordHash,
        role: 'owner',
      });
      await repository.create({
        email: 'user2@armalytech.com',
        passwordHash,
        role: 'admin',
      });

      await expect(
        updateEmailUseCase.execute(user1.id, {
          currentPassword: 'password',
          newEmail: 'user2@armalytech.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('UpdatePasswordUseCase', () => {
    it('updates password and increments tokenVersion when current password matches', async () => {
      const passwordHash = await hasher.hash('old-password');
      const user = await repository.create({
        email: 'user@armalytech.com',
        passwordHash,
        role: 'admin',
        mustChangePassword: true,
      });

      const updated = await updatePasswordUseCase.execute(user.id, {
        currentPassword: 'old-password',
        newPassword: 'brand-new-password',
      });

      expect(updated.mustChangePassword).toBe(false);
      expect(updated.tokenVersion).toBe(1);
      expect(await hasher.compare('brand-new-password', updated.passwordHash)).toBe(true);
    });

    it('rejects if new password is identical to current password', async () => {
      const passwordHash = await hasher.hash('current-password');
      const user = await repository.create({
        email: 'user@armalytech.com',
        passwordHash,
        role: 'admin',
      });

      await expect(
        updatePasswordUseCase.execute(user.id, {
          currentPassword: 'current-password',
          newPassword: 'current-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
