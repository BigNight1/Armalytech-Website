import { CreatePhoneUseCase } from './create-phone.use-case';
import { UpdatePhoneUseCase } from './update-phone.use-case';
import { DeletePhoneUseCase } from './delete-phone.use-case';
import { ListPhonesUseCase } from './list-phones.use-case';
import {
  BrandNotFoundError,
  DuplicatePhoneNameError,
  PhoneInUseError,
  PhoneNotFoundError,
} from '../../domain/inventory.errors';
import {
  FakeBrandRepository,
  FakeCategoryRepository,
  FakePhoneRepository,
  FakeProductRepository,
} from '../__tests__/fakes';

describe('Phone use cases', () => {
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

  it('creates a phone under a brand', async () => {
    const brand = await brands.create('Samsung');
    const create = new CreatePhoneUseCase(phones, brands);

    const phone = await create.execute(brand.id, 'Galaxy A54');

    expect(phone.name).toBe('Galaxy A54');
    expect(phone.brandId).toBe(brand.id);
  });

  it('throws BrandNotFoundError creating a phone for an unknown brand', async () => {
    const create = new CreatePhoneUseCase(phones, brands);
    await expect(create.execute('missing', 'Galaxy A54')).rejects.toThrow(
      BrandNotFoundError,
    );
  });

  it('rejects a duplicate phone name within the same brand, case-insensitively', async () => {
    const brand = await brands.create('Samsung');
    const create = new CreatePhoneUseCase(phones, brands);
    await create.execute(brand.id, 'Galaxy A54');

    await expect(create.execute(brand.id, 'galaxy a54')).rejects.toThrow(
      DuplicatePhoneNameError,
    );
  });

  it('allows the same phone name across different brands', async () => {
    const samsung = await brands.create('Samsung');
    const apple = await brands.create('Apple');
    const create = new CreatePhoneUseCase(phones, brands);

    await create.execute(samsung.id, 'A54');
    const second = await create.execute(apple.id, 'A54');

    expect(second.brandId).toBe(apple.id);
  });

  it('lists phones filtered by brand', async () => {
    const samsung = await brands.create('Samsung');
    const apple = await brands.create('Apple');
    await phones.create(samsung.id, 'Galaxy A54');
    await phones.create(apple.id, 'iPhone 13');

    const list = new ListPhonesUseCase(phones);
    const result = await list.execute(samsung.id);

    expect(result.map((p) => p.name)).toEqual(['Galaxy A54']);
  });

  it('updates a phone name', async () => {
    const brand = await brands.create('Samsung');
    const phone = await phones.create(brand.id, 'Galaxy A54');

    const update = new UpdatePhoneUseCase(phones, brands);
    const updated = await update.execute(phone.id, { name: 'Galaxy A54s' });

    expect(updated.name).toBe('Galaxy A54s');
  });

  it('throws PhoneNotFoundError updating an unknown phone', async () => {
    const update = new UpdatePhoneUseCase(phones, brands);
    await expect(update.execute('missing', { name: 'X' })).rejects.toThrow(
      PhoneNotFoundError,
    );
  });

  it('deletes a phone with no product references', async () => {
    const brand = await brands.create('Samsung');
    const phone = await phones.create(brand.id, 'Galaxy A54');

    const del = new DeletePhoneUseCase(phones, products);
    await del.execute(phone.id);

    expect(await phones.findById(phone.id)).toBeNull();
  });

  it('throws PhoneInUseError deleting a phone referenced by a product', async () => {
    const brand = await brands.create('Samsung');
    const phone = await phones.create(brand.id, 'Galaxy A54');
    const category = await categories.create('Micas');
    await products.create({
      categoryId: category.id,
      brandId: null,
      name: 'Mica A54',
      stock: 0,
      cost: 1,
      salePrice: 2,
      minStock: 0,
      compatiblePhoneIds: [phone.id],
    });

    const del = new DeletePhoneUseCase(phones, products);
    await expect(del.execute(phone.id)).rejects.toThrow(PhoneInUseError);
  });
});
