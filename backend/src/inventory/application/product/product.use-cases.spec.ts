import { CreateProductUseCase } from './create-product.use-case';
import { UpdateProductUseCase } from './update-product.use-case';
import { ArchiveProductUseCase } from './archive-product.use-case';
import { RestoreProductUseCase } from './restore-product.use-case';
import { AdjustProductStockUseCase } from './adjust-product-stock.use-case';
import { ListProductsUseCase } from './list-products.use-case';
import { GetProductUseCase } from './get-product.use-case';
import { ListProductMovementsUseCase } from './list-product-movements.use-case';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  InsufficientStockError,
  PhoneNotFoundError,
  ProductNotFoundError,
} from '../../domain/inventory.errors';
import {
  FakeBrandRepository,
  FakeCategoryRepository,
  FakePhoneRepository,
  FakeProductRepository,
  FakeStockMovementRepository,
} from '../__tests__/fakes';

const actor = { userId: 'u1', userEmail: 'admin@armalytech.com' };

describe('Product use cases', () => {
  let brands: FakeBrandRepository;
  let phones: FakePhoneRepository;
  let categories: FakeCategoryRepository;
  let products: FakeProductRepository;
  let movements: FakeStockMovementRepository;

  beforeEach(() => {
    brands = new FakeBrandRepository();
    phones = new FakePhoneRepository(brands);
    categories = new FakeCategoryRepository();
    products = new FakeProductRepository(categories, brands, phones);
    movements = new FakeStockMovementRepository();
  });

  describe('CreateProductUseCase', () => {
    it('creates a product with rounded money fields and populated relations', async () => {
      const category = await categories.create('Cargadores');
      const brand = await brands.create('JBL');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );

      const product = await create.execute(
        {
          categoryId: category.id,
          brandId: brand.id,
          name: 'Cargador tipo C',
          stock: 0,
          cost: 10.005,
          salePrice: 19.999,
          minStock: 2,
        },
        actor,
      );

      expect(product.cost).toBe(10.01);
      expect(product.salePrice).toBe(20);
      expect(product.category).toEqual({ id: category.id, name: 'Cargadores' });
      expect(product.brand).toEqual({ id: brand.id, name: 'JBL' });
      expect(product.active).toBe(true);
    });

    it('throws CategoryNotFoundError for an unknown category', async () => {
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      await expect(
        create.execute(
          {
            categoryId: 'missing',
            name: 'X',
            stock: 0,
            cost: 1,
            salePrice: 2,
            minStock: 0,
          },
          actor,
        ),
      ).rejects.toThrow(CategoryNotFoundError);
    });

    it('throws BrandNotFoundError for an unknown brand', async () => {
      const category = await categories.create('Cargadores');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      await expect(
        create.execute(
          {
            categoryId: category.id,
            brandId: 'missing',
            name: 'X',
            stock: 0,
            cost: 1,
            salePrice: 2,
            minStock: 0,
          },
          actor,
        ),
      ).rejects.toThrow(BrandNotFoundError);
    });

    it('throws PhoneNotFoundError when a compatible phone id does not exist', async () => {
      const category = await categories.create('Micas');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      await expect(
        create.execute(
          {
            categoryId: category.id,
            name: 'Mica',
            stock: 0,
            cost: 1,
            salePrice: 2,
            minStock: 0,
            compatiblePhoneIds: ['missing'],
          },
          actor,
        ),
      ).rejects.toThrow(PhoneNotFoundError);
    });

    it('writes an "ajuste_entrada" / "Stock inicial" movement when created with stock > 0', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );

      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 5,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );

      expect(movements.movements).toHaveLength(1);
      const movement = movements.movements[0];
      expect(movement.productId).toBe(product.id);
      expect(movement.type).toBe('ajuste_entrada');
      expect(movement.quantity).toBe(5);
      expect(movement.stockAfter).toBe(5);
      expect(movement.reason).toBe('Stock inicial');
      expect(movement.userEmail).toBe(actor.userEmail);
    });

    it('writes no movement when created with stock = 0', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );

      await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 0,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );

      expect(movements.movements).toHaveLength(0);
    });
  });

  describe('UpdateProductUseCase', () => {
    it('updates fields but never touches stock', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 5,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );

      const update = new UpdateProductUseCase(
        products,
        categories,
        brands,
        phones,
      );
      const updated = await update.execute(product.id, {
        name: 'Bateria Pro',
        salePrice: 25,
      });

      expect(updated.name).toBe('Bateria Pro');
      expect(updated.salePrice).toBe(25);
      expect(updated.stock).toBe(5);
    });

    it('throws ProductNotFoundError updating an unknown product', async () => {
      const update = new UpdateProductUseCase(
        products,
        categories,
        brands,
        phones,
      );
      await expect(update.execute('missing', { name: 'X' })).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });

  describe('Archive / restore', () => {
    it('archives a product (active=false) without deleting it', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 0,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );

      const archive = new ArchiveProductUseCase(products);
      await archive.execute(product.id);

      const get = new GetProductUseCase(products);
      expect((await get.execute(product.id)).active).toBe(false);
    });

    it('restores an archived product', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 0,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );
      await new ArchiveProductUseCase(products).execute(product.id);

      const restore = new RestoreProductUseCase(products);
      const restored = await restore.execute(product.id);

      expect(restored.active).toBe(true);
    });

    it('throws ProductNotFoundError archiving an unknown product', async () => {
      const archive = new ArchiveProductUseCase(products);
      await expect(archive.execute('missing')).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });

  describe('AdjustProductStockUseCase', () => {
    it('increases stock and writes an ajuste_entrada movement', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 2,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );

      const adjust = new AdjustProductStockUseCase(products, movements);
      const updated = await adjust.execute(
        product.id,
        { delta: 3, reason: 'Llegada de mercadería' },
        actor,
      );

      expect(updated.stock).toBe(5);
      const movement = movements.movements[movements.movements.length - 1];
      expect(movement.type).toBe('ajuste_entrada');
      expect(movement.quantity).toBe(3);
      expect(movement.stockAfter).toBe(5);
    });

    it('decreases stock and writes an ajuste_salida movement', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 5,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );

      const adjust = new AdjustProductStockUseCase(products, movements);
      const updated = await adjust.execute(
        product.id,
        { delta: -2, reason: 'Rotura' },
        actor,
      );

      expect(updated.stock).toBe(3);
      const movement = movements.movements[movements.movements.length - 1];
      expect(movement.type).toBe('ajuste_salida');
      expect(movement.quantity).toBe(-2);
    });

    it('throws InsufficientStockError when the delta would go below zero, without writing a movement', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 2,
          cost: 10,
          salePrice: 20,
          minStock: 1,
        },
        actor,
      );
      movements.movements = [];

      const adjust = new AdjustProductStockUseCase(products, movements);
      await expect(
        adjust.execute(product.id, { delta: -5 }, actor),
      ).rejects.toThrow(InsufficientStockError);
      expect(movements.movements).toHaveLength(0);
      expect((await products.findById(product.id))?.stock).toBe(2);
    });

    it('throws ProductNotFoundError adjusting an unknown product', async () => {
      const adjust = new AdjustProductStockUseCase(products, movements);
      await expect(
        adjust.execute('missing', { delta: 1 }, actor),
      ).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('ListProductsUseCase', () => {
    it('finds products compatible with a phone matched by name ("A54")', async () => {
      const samsung = await brands.create('Samsung');
      const phone = await phones.create(samsung.id, 'Galaxy A54');
      const category = await categories.create('Micas');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Mica templada',
          stock: 0,
          cost: 1,
          salePrice: 3,
          minStock: 0,
          compatiblePhoneIds: [phone.id],
        },
        actor,
      );
      // Unrelated product that should not match.
      await create.execute(
        {
          categoryId: category.id,
          name: 'Cable USB',
          stock: 0,
          cost: 1,
          salePrice: 3,
          minStock: 0,
        },
        actor,
      );

      const list = new ListProductsUseCase(products);
      const result = await list.execute({ q: 'a54' });

      expect(result.items.map((p) => p.id)).toEqual([product.id]);
      expect(result.matchedPhones.map((p) => p.name)).toEqual(['Galaxy A54']);
      expect(result.matchedPhones[0].brandName).toBe('Samsung');
    });

    it('filters by lowStock (stock <= minStock)', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const low = await create.execute(
        {
          categoryId: category.id,
          name: 'Bajo stock',
          stock: 1,
          cost: 1,
          salePrice: 2,
          minStock: 2,
        },
        actor,
      );
      await create.execute(
        {
          categoryId: category.id,
          name: 'Stock normal',
          stock: 10,
          cost: 1,
          salePrice: 2,
          minStock: 2,
        },
        actor,
      );

      const list = new ListProductsUseCase(products);
      const result = await list.execute({ lowStock: true });

      expect(result.items.map((p) => p.id)).toEqual([low.id]);
    });

    it('excludes archived products unless includeArchived is set', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Archivado',
          stock: 0,
          cost: 1,
          salePrice: 2,
          minStock: 0,
        },
        actor,
      );
      await new ArchiveProductUseCase(products).execute(product.id);

      const list = new ListProductsUseCase(products);
      expect((await list.execute({})).items).toHaveLength(0);
      expect(
        (await list.execute({ includeArchived: true })).items,
      ).toHaveLength(1);
    });
  });

  describe('ListProductMovementsUseCase', () => {
    it('lists movements for a product, newest first', async () => {
      const category = await categories.create('Repuestos');
      const create = new CreateProductUseCase(
        products,
        categories,
        brands,
        phones,
        movements,
      );
      const product = await create.execute(
        {
          categoryId: category.id,
          name: 'Bateria',
          stock: 1,
          cost: 1,
          salePrice: 2,
          minStock: 0,
        },
        actor,
      );
      const adjust = new AdjustProductStockUseCase(products, movements);
      await adjust.execute(product.id, { delta: 1 }, actor);
      await adjust.execute(product.id, { delta: -1 }, actor);

      const list = new ListProductMovementsUseCase(products, movements);
      const result = await list.execute(product.id);

      expect(result.total).toBe(3);
      expect(result.items[0].quantity).toBe(-1);
    });

    it('throws ProductNotFoundError for an unknown product', async () => {
      const list = new ListProductMovementsUseCase(products, movements);
      await expect(list.execute('missing')).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });
});
