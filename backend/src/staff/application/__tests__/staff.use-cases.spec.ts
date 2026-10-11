import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  ListStaffUseCase,
  CreateStaffUseCase,
  ToggleStaffStatusUseCase,
  ResetStaffPasswordUseCase,
} from '../staff.use-cases';
import {
  FakeUserRepository,
  FakePasswordHasher,
} from '../../../auth/application/__tests__/fakes';

describe('Staff Use Cases', () => {
  let repository: FakeUserRepository;
  let hasher: FakePasswordHasher;
  let listStaffUseCase: ListStaffUseCase;
  let createStaffUseCase: CreateStaffUseCase;
  let toggleStaffStatusUseCase: ToggleStaffStatusUseCase;
  let resetStaffPasswordUseCase: ResetStaffPasswordUseCase;

  beforeEach(() => {
    repository = new FakeUserRepository();
    hasher = new FakePasswordHasher();
    listStaffUseCase = new ListStaffUseCase(repository);
    createStaffUseCase = new CreateStaffUseCase(repository, hasher);
    toggleStaffStatusUseCase = new ToggleStaffStatusUseCase(repository);
    resetStaffPasswordUseCase = new ResetStaffPasswordUseCase(
      repository,
      hasher,
    );
  });

  it('lists all staff members', async () => {
    await repository.create({
      email: 'owner@armalytech.com',
      passwordHash: 'hash',
      role: 'owner',
    });
    const list = await listStaffUseCase.execute();
    expect(list.length).toBe(1);
    expect(list[0].email).toBe('owner@armalytech.com');
  });

  it('creates staff with temporary password and mustChangePassword=true', async () => {
    const created = await createStaffUseCase.execute(
      { email: 'newstaff@armalytech.com', password: 'temp-password' },
      'owner@armalytech.com',
    );

    expect(created.email).toBe('newstaff@armalytech.com');
    expect(created.role).toBe('admin');
    expect(created.mustChangePassword).toBe(true);
    expect(created.createdBy).toBe('owner@armalytech.com');
  });

  it('rejects duplicate email on creation', async () => {
    await repository.create({
      email: 'staff@armalytech.com',
      passwordHash: 'hash',
      role: 'admin',
    });

    await expect(
      createStaffUseCase.execute(
        { email: 'staff@armalytech.com', password: 'pass' },
        'owner@armalytech.com',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('prevents owner from deactivating their own account', async () => {
    const owner = await repository.create({
      email: 'owner@armalytech.com',
      passwordHash: 'hash',
      role: 'owner',
    });

    await expect(
      toggleStaffStatusUseCase.execute(owner.id, false, owner.id),
    ).rejects.toThrow(BadRequestException);
  });

  it('resets password and sets mustChangePassword=true', async () => {
    const staff = await repository.create({
      email: 'staff@armalytech.com',
      passwordHash: 'old-hash',
      role: 'admin',
      mustChangePassword: false,
    });

    const updated = await resetStaffPasswordUseCase.execute(
      staff.id,
      'new-temp-password',
    );
    expect(updated.mustChangePassword).toBe(true);
    expect(updated.tokenVersion).toBe(1);
  });
});
