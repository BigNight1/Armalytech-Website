import { CreateCategoryUseCase } from './create-category.use-case';
import { UpdateCategoryUseCase } from './update-category.use-case';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { ListCategoriesUseCase } from './list-categories.use-case';
import {
  SeedDefaultCategoriesUseCase,
  DEFAULT_CATEGORY_NAMES,
} from './seed-default-categories.use-case';
import {
  CategoryInUseError,
  CategoryNotFoundError,
  DuplicateCategoryNameError,
} from '../../domain/inventory.errors';
import {
  FakeBrandRepository,
  FakeCategoryRepository,
  FakePhoneRepository,
  FakeProductRepository,
} from '../__tests__/fakes';

describe('Category use cases', () => {
  let categories: FakeCategoryRepository;
  let brands: FakeBrandRepository;
  let phones: FakePhoneRepository;
  let products: FakeProductRepository;

  beforeEach(() => {
    categories = new FakeCategoryRepository();
    brands = new FakeBrandRepository();
    phones = new FakePhoneRepository(brands);
    products = new FakeProductRepository(categories, brands, phones);
  });

  it('creates a category', async () => {
    const create = new CreateCategoryUseCase(categories);
    const category = await create.execute('Pantallas');
    expect(category.name).toBe('Pantallas');
  });

  it('rejects a duplicate category name case-insensitively', async () => {
    const create = new CreateCategoryUseCase(categories);
    await create.execute('Pantallas');

    await expect(create.execute('pantallas')).rejects.toThrow(
      DuplicateCategoryNameError,
    );
  });

  it('updates a category name', async () => {
    const create = new CreateCategoryUseCase(categories);
    const update = new UpdateCategoryUseCase(categories);
    const category = await create.execute('Pantallas');

    const updated = await update.execute(category.id, 'Pantallas OLED');

    expect(updated.name).toBe('Pantallas OLED');
  });

  it('throws CategoryNotFoundError updating an unknown category', async () => {
    const update = new UpdateCategoryUseCase(categories);
    await expect(update.execute('missing', 'X')).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  it('lists categories sorted by name', async () => {
    const create = new CreateCategoryUseCase(categories);
    await create.execute('Zócalos');
    await create.execute('Cables');

    const list = new ListCategoriesUseCase(categories);
    const result = await list.execute();

    expect(result.map((c) => c.name)).toEqual(['Cables', 'Zócalos']);
  });

  it('deletes a category with no product references', async () => {
    const create = new CreateCategoryUseCase(categories);
    const category = await create.execute('Pantallas');

    const del = new DeleteCategoryUseCase(categories, products);
    await del.execute(category.id);

    expect(await categories.findById(category.id)).toBeNull();
  });

  it('throws CategoryInUseError deleting a category used by a product', async () => {
    const category = await categories.create('Pantallas');
    await products.create({
      categoryId: category.id,
      brandId: null,
      name: 'Pantalla generica',
      stock: 0,
      cost: 1,
      salePrice: 2,
      minStock: 0,
      compatiblePhoneIds: [],
    });

    const del = new DeleteCategoryUseCase(categories, products);
    await expect(del.execute(category.id)).rejects.toThrow(CategoryInUseError);
  });

  it('seeds the default categories only when the collection is empty', async () => {
    const seed = new SeedDefaultCategoriesUseCase(categories);
    await seed.execute();

    expect((await categories.findAll()).map((c) => c.name).sort()).toEqual(
      [...DEFAULT_CATEGORY_NAMES].sort(),
    );

    await categories.create('Extra');
    await seed.execute();
    const seededAgain = await categories.findAll();
    expect(seededAgain).toHaveLength(DEFAULT_CATEGORY_NAMES.length + 1);
  });
});
