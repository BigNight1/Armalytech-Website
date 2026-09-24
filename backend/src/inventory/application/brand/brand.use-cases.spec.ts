import { CreateBrandUseCase } from './create-brand.use-case';
import { UpdateBrandUseCase } from './update-brand.use-case';
import { DeleteBrandUseCase } from './delete-brand.use-case';
import { ListBrandsUseCase } from './list-brands.use-case';
import {
  BrandNotFoundError,
  DuplicateBrandNameError,
} from '../../domain/inventory.errors';
import { FakeBrandRepository } from '../__tests__/fakes';

describe('Brand use cases', () => {
  let repo: FakeBrandRepository;

  beforeEach(() => {
    repo = new FakeBrandRepository();
  });

  it('creates a brand', async () => {
    const useCase = new CreateBrandUseCase(repo);
    const brand = await useCase.execute('Samsung');
    expect(brand.name).toBe('Samsung');
  });

  it('rejects a duplicate brand name case-insensitively', async () => {
    const create = new CreateBrandUseCase(repo);
    await create.execute('Samsung');

    await expect(create.execute('samsung')).rejects.toThrow(
      DuplicateBrandNameError,
    );
  });

  it('updates a brand name', async () => {
    const create = new CreateBrandUseCase(repo);
    const update = new UpdateBrandUseCase(repo);
    const brand = await create.execute('Samsung');

    const updated = await update.execute(brand.id, 'Samsung Electronics');

    expect(updated.name).toBe('Samsung Electronics');
  });

  it('throws BrandNotFoundError updating an unknown brand', async () => {
    const update = new UpdateBrandUseCase(repo);
    await expect(update.execute('missing', 'X')).rejects.toThrow(
      BrandNotFoundError,
    );
  });

  it('lists brands sorted by name', async () => {
    const create = new CreateBrandUseCase(repo);
    await create.execute('Xiaomi');
    await create.execute('Apple');

    const list = new ListBrandsUseCase(repo);
    const brands = await list.execute();

    expect(brands.map((b) => b.name)).toEqual(['Apple', 'Xiaomi']);
  });

  it('deletes a brand', async () => {
    const create = new CreateBrandUseCase(repo);
    const brand = await create.execute('Samsung');

    const del = new DeleteBrandUseCase(repo);
    await del.execute(brand.id);

    expect(await repo.findById(brand.id)).toBeNull();
  });

  it('throws BrandNotFoundError deleting an unknown brand', async () => {
    const del = new DeleteBrandUseCase(repo);
    await expect(del.execute('missing')).rejects.toThrow(BrandNotFoundError);
  });
});
