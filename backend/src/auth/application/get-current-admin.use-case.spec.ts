import { GetCurrentAdminUseCase } from './get-current-admin.use-case';
import { AdminNotFoundError } from '../domain/auth.errors';
import { FakeUserRepository } from './__tests__/fakes';

describe('GetCurrentAdminUseCase', () => {
  it('returns the user by id', async () => {
    const repository = new FakeUserRepository();
    const created = await repository.create({
      email: 'tech@armalytech.com',
      passwordHash: 'hashed:x',
      role: 'owner',
    });
    const useCase = new GetCurrentAdminUseCase(repository);

    const user = await useCase.execute(created.id);

    expect(user.email).toBe('tech@armalytech.com');
  });

  it('throws AdminNotFoundError for an unknown id', async () => {
    const repository = new FakeUserRepository();
    const useCase = new GetCurrentAdminUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(
      AdminNotFoundError,
    );
  });
});
