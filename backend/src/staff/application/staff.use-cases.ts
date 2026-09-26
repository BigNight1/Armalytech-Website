import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../auth/domain/user.entity';
import {
  UserRepository,
  USER_REPOSITORY,
} from '../../auth/domain/user-repository.port';
import {
  PasswordHasher,
  PASSWORD_HASHER,
} from '../../auth/domain/password-hasher.port';
import { CreateStaffDto } from '../dto/create-staff.dto';

@Injectable()
export class ListStaffUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

@Injectable()
export class CreateStaffUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(dto: CreateStaffDto, creatorEmail: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico',
      );
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    return this.userRepository.create({
      email: dto.email,
      passwordHash,
      role: 'admin',
      active: true,
      tokenVersion: 0,
      mustChangePassword: true,
      createdBy: creatorEmail,
    });
  }
}

@Injectable()
export class ToggleStaffStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(
    targetId: string,
    active: boolean,
    requesterId: string,
  ): Promise<User> {
    if (targetId === requesterId && !active) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    const user = await this.userRepository.findById(targetId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === 'owner' && !active) {
      const activeOwners = await this.userRepository.countActiveOwners();
      if (activeOwners <= 1) {
        throw new BadRequestException('Debe existir al menos un owner activo');
      }
    }

    const updated = await this.userRepository.update(targetId, {
      active,
      tokenVersion: user.tokenVersion + 1, // Invalidates all existing sessions immediately
    });

    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updated;
  }
}

@Injectable()
export class ResetStaffPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(targetId: string, newPasswordPlain: string): Promise<User> {
    const user = await this.userRepository.findById(targetId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordHash = await this.passwordHasher.hash(newPasswordPlain);
    const updated = await this.userRepository.update(targetId, {
      passwordHash,
      mustChangePassword: true,
      tokenVersion: user.tokenVersion + 1, // Invalidates all existing sessions
    });

    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updated;
  }
}
