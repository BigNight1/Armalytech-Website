import { CreateBrandUseCase } from './create-brand.use-case';
import { UpdateBrandUseCase } from './update-brand.use-case';
import { DeleteBrandUseCase } from './delete-brand.use-case';
import { ListBrandsUseCase } from './list-brands.use-case';
import {
  BrandInUseError,
  BrandNotFoundError,
  DuplicateBrandNameError,
} from '../../domain/inventory.errors';
import {
  FakeBrandRepository,
  FakeCategoryRepository,
  FakePhoneRepository,
  FakeProductRepository,
} from '../__tests__/fakes';

describe('Brand use cases', () => {
  let brands: FakeBrandRepository;
  let phones: FakePhoneRepository;
  let categories: FakeCategoryRepository;
  let products: FakeProductRepository;

  beforeEach(() => {
    brands = new FakeBrandRepository();
    phones = new FakePhoneRepository(brands);
    categories = new FakeCategoryRepository();
    products = new FakeProductRepository(categories, brands, phones);
  });

  it('creates a brand', async () => {
    const useCase = new CreateBrandUseCase(brands);
    const brand = await useCase.execute('Samsung');
    expect(brand.name).toBe('Samsung');
  });

  it('rejects a duplicate brand name case-insensitively', async () => {
    const create = new CreateBrandUseCase(brands);
    await create.execute('Samsung');

    await expect(create.execute('samsung')).rejects.toThrow(
      DuplicateBrandNameError,
    );
  });

  it('updates a brand name', async () => {
    const create = new CreateBrandUseCase(brands);
    const update = new UpdateBrandUseCase(brands);
    const brand = await create.execute('Samsung');

    const updated = await update.execute(brand.id, 'Samsung Electronics');

    expect(updated.name).toBe('Samsung Electronics');
  });

  it('throws BrandNotFoundError updating an unknown brand', async () => {
    const update = new UpdateBrandUseCase(brands);
    await expect(update.execute('missing', 'X')).rejects.toThrow(
      BrandNotFoundError,
    );
  });

  it('lists brands sorted by name', async () => {
    const create = new CreateBrandUseCase(brands);
    await create.execute('Xiaomi');
    await create.execute('Apple');

    const list = new ListBrandsUseCase(brands);
    const list_brands = await list.execute();

    expect(list_brands.map((b) => b.name)).toEqual(['Apple', 'Xiaomi']);
  });

  it('deletes a brand with no references', async () => {
    const create = new CreateBrandUseCase(brands);
    const brand = await create.execute('Samsung');

    const del = new DeleteBrandUseCase(brands, phones, products);
    await del.execute(brand.id);

    expect(await brands.findById(brand.id)).toBeNull();
  });

  it('throws BrandNotFoundError deleting an unknown brand', async () => {
    const del = new DeleteBrandUseCase(brands, phones, products);
    await expect(del.execute('missing')).rejects.toThrow(BrandNotFoundError);
  });

  it('throws BrandInUseError deleting a brand referenced by a phone', async () => {
    const brand = await brands.create('Samsung');
    await phones.create(brand.id, 'Galaxy A54');

    const del = new DeleteBrandUseCase(brands, phones, products);
    await expect(del.execute(brand.id)).rejects.toThrow(BrandInUseError);
  });

  it('throws BrandInUseError deleting a brand referenced by a product', async () => {
    const brand = await brands.create('JBL');
    const category = await categories.create('Parlantes');
    await products.create({
      categoryId: category.id,
      brandId: brand.id,
      name: 'Speaker',
      stock: 0,
      cost: 10,
      salePrice: 20,
      minStock: 0,
      compatiblePhoneIds: [],
    });

    const del = new DeleteBrandUseCase(brands, phones, products);
    await expect(del.execute(brand.id)).rejects.toThrow(BrandInUseError);
  });
});
