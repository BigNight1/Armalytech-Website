import { LoginUseCase } from './login.use-case';
import { InvalidCredentialsError } from '../domain/auth.errors';
import { FakeAdminRepository, FakePasswordHasher } from './__tests__/fakes';

describe('LoginUseCase', () => {
  let repository: FakeAdminRepository;
  let hasher: FakePasswordHasher;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repository = new FakeAdminRepository();
    hasher = new FakePasswordHasher();
    useCase = new LoginUseCase(repository, hasher);
  });

  it('returns the admin when credentials match', async () => {
    const passwordHash = await hasher.hash('correct-horse');
    await repository.create('tech', passwordHash);

    const admin = await useCase.execute({
      username: 'tech',
      password: 'correct-horse',
    });

    expect(admin.username).toBe('tech');
  });

  it('throws InvalidCredentialsError for an unknown username', async () => {
    await expect(
      useCase.execute({ username: 'ghost', password: 'whatever' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError for a wrong password', async () => {
    const passwordHash = await hasher.hash('correct-horse');
    await repository.create('tech', passwordHash);

    await expect(
      useCase.execute({ username: 'tech', password: 'wrong' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
