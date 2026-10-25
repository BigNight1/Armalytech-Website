import { LogoutUseCase } from './logout.use-case';
import { FakeUserRepository } from './__tests__/fakes';

/**
 * 2026-10-25 hardening (C1): logout must revoke, not just drop the cookie.
 * `SessionGuard` compares the token's `tokenVersion` with the stored one, so a
 * bump here is what kills an already-issued (possibly copied) token.
 */
describe('LogoutUseCase', () => {
  let repository: FakeUserRepository;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    repository = new FakeUserRepository();
    useCase = new LogoutUseCase(repository);
  });

  it('increments the tokenVersion so previously issued tokens stop matching', async () => {
    const user = repository.seed({
      email: 'tech@armalytech.com',
      passwordHash: 'hashed:correct-horse',
    });
    expect(user.tokenVersion).toBe(0);

    await useCase.execute(user.id);

    const stored = await repository.findById(user.id);
    expect(stored?.tokenVersion).toBe(1);
  });

  it('is idempotent for an unknown user id', async () => {
    await expect(useCase.execute('does-not-exist')).resolves.toBeUndefined();
  });

  it('is a no-op without a user id (public logout with no valid cookie)', async () => {
    const user = repository.seed({
      email: 'tech@armalytech.com',
      passwordHash: 'hashed:correct-horse',
    });

    await expect(useCase.execute(undefined)).resolves.toBeUndefined();

    const stored = await repository.findById(user.id);
    expect(stored?.tokenVersion).toBe(0);
  });
});
