import { GetCurrentAdminUseCase } from './get-current-admin.use-case';
import { AdminNotFoundError } from '../domain/auth.errors';
import { FakeAdminRepository } from './__tests__/fakes';

describe('GetCurrentAdminUseCase', () => {
  it('returns the admin by id', async () => {
    const repository = new FakeAdminRepository();
    const created = await repository.create('tech', 'hashed:x');
    const useCase = new GetCurrentAdminUseCase(repository);

    const admin = await useCase.execute(created.id);

    expect(admin.username).toBe('tech');
  });

  it('throws AdminNotFoundError for an unknown id', async () => {
    const repository = new FakeAdminRepository();
    const useCase = new GetCurrentAdminUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(
      AdminNotFoundError,
    );
  });
});
