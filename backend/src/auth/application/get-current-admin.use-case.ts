import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../domain/user-repository.port';
import { AdminNotFoundError } from '../domain/auth.errors';

@Injectable()
export class GetCurrentAdminUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AdminNotFoundError(id);
    }
    return user;
  }
}
