import { LoginUseCase } from './login.use-case';
import {
  InvalidCredentialsError,
  InactiveUserError,
} from '../domain/auth.errors';
import { FakeUserRepository, FakePasswordHasher } from './__tests__/fakes';

describe('LoginUseCase', () => {
  let repository: FakeUserRepository;
  let hasher: FakePasswordHasher;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repository = new FakeUserRepository();
    hasher = new FakePasswordHasher();
    useCase = new LoginUseCase(repository, hasher);
  });

  it('returns the user when credentials match with email', async () => {
    const passwordHash = await hasher.hash('correct-horse');
    await repository.create({
      email: 'tech@armalytech.com',
      passwordHash,
      role: 'owner',
    });

    const user = await useCase.execute({
      email: 'tech@armalytech.com',
      password: 'correct-horse',
    });

    expect(user.email).toBe('tech@armalytech.com');
    expect(user.role).toBe('owner');
  });

  it('throws InvalidCredentialsError for an unknown email', async () => {
    await expect(
      useCase.execute({ email: 'ghost@test.com', password: 'whatever' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError for a wrong password', async () => {
    const passwordHash = await hasher.hash('correct-horse');
    await repository.create({
      email: 'tech@armalytech.com',
      passwordHash,
      role: 'admin',
    });

    await expect(
      useCase.execute({ email: 'tech@armalytech.com', password: 'wrong' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InactiveUserError for a deactivated user', async () => {
    const passwordHash = await hasher.hash('correct-horse');
    await repository.create({
      email: 'disabled@armalytech.com',
      passwordHash,
      role: 'admin',
      active: false,
    });

    await expect(
      useCase.execute({
        email: 'disabled@armalytech.com',
        password: 'correct-horse',
      }),
    ).rejects.toThrow(InactiveUserError);
  });
});
