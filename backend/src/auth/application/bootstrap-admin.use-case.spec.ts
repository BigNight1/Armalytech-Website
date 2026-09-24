import { BootstrapAdminUseCase } from './bootstrap-admin.use-case';
import { FakeUserRepository, FakePasswordHasher } from './__tests__/fakes';

describe('BootstrapAdminUseCase', () => {
  it('creates the owner from env credentials when the collection is empty', async () => {
    const repository = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    const useCase = new BootstrapAdminUseCase(repository, hasher);

    await useCase.execute({ email: 'admin@armalytech.com', password: 'change-me' });

    const created = await repository.findByEmail('admin@armalytech.com');
    expect(created).not.toBeNull();
    expect(created?.passwordHash).toBe('hashed:change-me');
    expect(created?.role).toBe('owner');
  });

  it('is a no-op when an owner already exists', async () => {
    const repository = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    await repository.create({
      email: 'existing@armalytech.com',
      passwordHash: 'hashed:x',
      role: 'owner',
    });
    const useCase = new BootstrapAdminUseCase(repository, hasher);

    await useCase.execute({ email: 'admin@armalytech.com', password: 'change-me' });

    expect(await repository.count()).toBe(1);
    expect(await repository.findByEmail('admin@armalytech.com')).toBeNull();
  });

  it('is a no-op when credentials are missing', async () => {
    const repository = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    const useCase = new BootstrapAdminUseCase(repository, hasher);

    await useCase.execute({});

    expect(await repository.count()).toBe(0);
  });
});
