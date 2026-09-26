import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../domain/user-repository.port';
import {
  PasswordHasher,
  PASSWORD_HASHER,
} from '../domain/password-hasher.port';
import {
  InvalidCredentialsError,
  InactiveUserError,
} from '../domain/auth.errors';

export interface LoginInput {
  email?: string;
  username?: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<User> {
    const identifier = input.email || input.username;
    if (!identifier) {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(identifier);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new InactiveUserError();
    }

    const matches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!matches) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
