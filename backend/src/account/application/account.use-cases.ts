import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import { UpdateEmailDto } from '../dto/update-email.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';

@Injectable()
export class UpdateEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(userId: string, dto: UpdateEmailDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const matches = await this.passwordHasher.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase().trim();
    if (normalizedNewEmail === user.email) {
      return user;
    }

    const existingWithEmail = await this.userRepository.findByEmail(normalizedNewEmail);
    if (existingWithEmail && existingWithEmail.id !== user.id) {
      throw new ConflictException('El nuevo correo electrónico ya está registrado por otro usuario');
    }

    const updated = await this.userRepository.update(user.id, {
      email: normalizedNewEmail,
      tokenVersion: user.tokenVersion + 1, // Invalidates all other active sessions
    });

    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updated;
  }
}

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(userId: string, dto: UpdatePasswordDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const matches = await this.passwordHasher.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const isSamePassword = await this.passwordHasher.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la anterior');
    }

    const passwordHash = await this.passwordHasher.hash(dto.newPassword);
    const updated = await this.userRepository.update(user.id, {
      passwordHash,
      mustChangePassword: false,
      tokenVersion: user.tokenVersion + 1, // Invalidates all other active sessions
    });

    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updated;
  }
}
