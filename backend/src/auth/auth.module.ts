import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './infrastructure/schemas/user.schema';
import { MongooseUserRepository } from './infrastructure/user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { SessionTokenService } from './infrastructure/session-token.service';
import { SessionGuard } from './infrastructure/session.guard';
import { RolesGuard } from './infrastructure/roles.guard';
import { AuthController } from './infrastructure/auth.controller';
import { USER_REPOSITORY } from './domain/user-repository.port';
import { ADMIN_REPOSITORY } from './domain/admin-repository.port';
import { PASSWORD_HASHER } from './domain/password-hasher.port';
import { LoginUseCase } from './application/login.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { BootstrapAdminUseCase } from './application/bootstrap-admin.use-case';
import { GetCurrentAdminUseCase } from './application/get-current-admin.use-case';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: MongooseUserRepository },
    { provide: ADMIN_REPOSITORY, useClass: MongooseUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    SessionTokenService,
    LoginUseCase,
    LogoutUseCase,
    BootstrapAdminUseCase,
    GetCurrentAdminUseCase,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    USER_REPOSITORY,
    ADMIN_REPOSITORY,
    PASSWORD_HASHER,
    SessionTokenService,
  ],
})
export class AuthModule implements OnApplicationBootstrap {
  constructor(
    private readonly bootstrapAdminUseCase: BootstrapAdminUseCase,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.bootstrapAdminUseCase.execute({
      email: this.configService.get<string>('ADMIN_EMAIL'),
      username: this.configService.get<string>('ADMIN_USERNAME'),
      password: this.configService.get<string>('ADMIN_PASSWORD'),
    });
  }
}
