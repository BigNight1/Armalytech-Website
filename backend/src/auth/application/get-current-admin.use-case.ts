import { Inject, Injectable } from '@nestjs/common';
import { Admin } from '../domain/admin.entity';
import {
  AdminRepository,
  ADMIN_REPOSITORY,
} from '../domain/admin-repository.port';
import { AdminNotFoundError } from '../domain/auth.errors';

@Injectable()
export class GetCurrentAdminUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepository: AdminRepository,
  ) {}

  async execute(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new AdminNotFoundError(id);
    }
    return admin;
  }
}
