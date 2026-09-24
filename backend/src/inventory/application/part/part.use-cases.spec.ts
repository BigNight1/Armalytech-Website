import { CreatePartUseCase } from './create-part.use-case';
import { UpdatePartUseCase } from './update-part.use-case';
import { DeletePartUseCase } from './delete-part.use-case';
import { AdjustPartQuantityUseCase } from './adjust-part-quantity.use-case';
import {
  InsufficientStockError,
  ModelNotFoundError,
  PartNotFoundError,
} from '../../domain/inventory.errors';
import { FakeModelRepository, FakePartRepository } from '../__tests__/fakes';

describe('Part use cases', () => {
  let models: FakeModelRepository;
  let parts: FakePartRepository;

  beforeEach(() => {
    models = new FakeModelRepository();
    parts = new FakePartRepository();
  });

  it('creates a part with rounded money fields', async () => {
    const model = await models.create('brand-1', 'Galaxy A10');
    const create = new CreatePartUseCase(parts, models);

    const part = await create.execute(model.id, {
      name: 'Pantalla',
      quantity: 5,
      purchasePrice: 10.005,
      salePrice: 19.999,
    });

    expect(part.purchasePrice).toBe(10.01);
    expect(part.salePrice).toBe(20);
  });

  it('throws ModelNotFoundError creating a part for an unknown model', async () => {
    const create = new CreatePartUseCase(parts, models);
    await expect(
      create.execute('missing', {
        name: 'Pantalla',
        quantity: 1,
        purchasePrice: 1,
        salePrice: 2,
      }),
    ).rejects.toThrow(ModelNotFoundError);
  });

  it('updates a part', async () => {
    const model = await models.create('brand-1', 'Galaxy A10');
    const part = await parts.create(model.id, {
      name: 'Pantalla',
      quantity: 5,
      purchasePrice: 10,
      salePrice: 20,
    });

    const update = new UpdatePartUseCase(parts);
    const updated = await update.execute(part.id, { quantity: 8 });

    expect(updated.quantity).toBe(8);
  });

  it('throws PartNotFoundError deleting an unknown part', async () => {
    const del = new DeletePartUseCase(parts);
    await expect(del.execute('missing')).rejects.toThrow(PartNotFoundError);
  });

  it('adjusts quantity upward', async () => {
    const model = await models.create('brand-1', 'Galaxy A10');
    const part = await parts.create(model.id, {
      name: 'Pantalla',
      quantity: 5,
      purchasePrice: 10,
      salePrice: 20,
    });

    const adjust = new AdjustPartQuantityUseCase(parts);
    const updated = await adjust.execute(part.id, 3);

    expect(updated.quantity).toBe(8);
  });

  it('throws InsufficientStockError when the delta would go below zero', async () => {
    const model = await models.create('brand-1', 'Galaxy A10');
    const part = await parts.create(model.id, {
      name: 'Pantalla',
      quantity: 2,
      purchasePrice: 10,
      salePrice: 20,
    });

    const adjust = new AdjustPartQuantityUseCase(parts);

    await expect(adjust.execute(part.id, -5)).rejects.toThrow(
      InsufficientStockError,
    );
    expect((await parts.findById(part.id))?.quantity).toBe(2);
  });

  it('throws PartNotFoundError adjusting an unknown part', async () => {
    const adjust = new AdjustPartQuantityUseCase(parts);
    await expect(adjust.execute('missing', 1)).rejects.toThrow(
      PartNotFoundError,
    );
  });
});
