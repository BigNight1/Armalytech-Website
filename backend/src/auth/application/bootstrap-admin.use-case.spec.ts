import { BootstrapAdminUseCase } from './bootstrap-admin.use-case';
import { FakeAdminRepository, FakePasswordHasher } from './__tests__/fakes';

describe('BootstrapAdminUseCase', () => {
  it('creates the admin from env credentials when the collection is empty', async () => {
    const repository = new FakeAdminRepository();
    const hasher = new FakePasswordHasher();
    const useCase = new BootstrapAdminUseCase(repository, hasher);

    await useCase.execute({ username: 'admin', password: 'change-me' });

    const created = await repository.findByUsername('admin');
    expect(created).not.toBeNull();
    expect(created?.passwordHash).toBe('hashed:change-me');
  });

  it('is a no-op when an admin already exists', async () => {
    const repository = new FakeAdminRepository();
    const hasher = new FakePasswordHasher();
    await repository.create('existing', 'hashed:x');
    const useCase = new BootstrapAdminUseCase(repository, hasher);

    await useCase.execute({ username: 'admin', password: 'change-me' });

    expect(await repository.count()).toBe(1);
    expect(await repository.findByUsername('admin')).toBeNull();
  });

  it('is a no-op when credentials are missing', async () => {
    const repository = new FakeAdminRepository();
    const hasher = new FakePasswordHasher();
    const useCase = new BootstrapAdminUseCase(repository, hasher);

    await useCase.execute({});

    expect(await repository.count()).toBe(0);
  });
});
