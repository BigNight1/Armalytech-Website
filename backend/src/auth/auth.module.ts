import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModel, AdminSchema } from './infrastructure/schemas/admin.schema';
import { MongooseAdminRepository } from './infrastructure/admin.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { SessionTokenService } from './infrastructure/session-token.service';
import { SessionGuard } from './infrastructure/session.guard';
import { AuthController } from './infrastructure/auth.controller';
import { ADMIN_REPOSITORY } from './domain/admin-repository.port';
import { PASSWORD_HASHER } from './domain/password-hasher.port';
import { LoginUseCase } from './application/login.use-case';
import { BootstrapAdminUseCase } from './application/bootstrap-admin.use-case';
import { GetCurrentAdminUseCase } from './application/get-current-admin.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AdminModel.name, schema: AdminSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: ADMIN_REPOSITORY, useClass: MongooseAdminRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    SessionTokenService,
    LoginUseCase,
    BootstrapAdminUseCase,
    GetCurrentAdminUseCase,
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [ADMIN_REPOSITORY, PASSWORD_HASHER],
})
export class AuthModule implements OnApplicationBootstrap {
  constructor(
    private readonly bootstrapAdminUseCase: BootstrapAdminUseCase,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.bootstrapAdminUseCase.execute({
      username: this.configService.get<string>('ADMIN_USERNAME'),
      password: this.configService.get<string>('ADMIN_PASSWORD'),
    });
  }
}
