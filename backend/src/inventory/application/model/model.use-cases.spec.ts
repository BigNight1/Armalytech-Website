import { CreateModelUseCase } from './create-model.use-case';
import { UpdateModelUseCase } from './update-model.use-case';
import { DeleteModelUseCase } from './delete-model.use-case';
import { ListModelsUseCase } from './list-models.use-case';
import {
  BrandNotFoundError,
  ModelNotFoundError,
} from '../../domain/inventory.errors';
import { FakeBrandRepository, FakeModelRepository } from '../__tests__/fakes';

describe('Model use cases', () => {
  let brands: FakeBrandRepository;
  let models: FakeModelRepository;

  beforeEach(() => {
    brands = new FakeBrandRepository();
    models = new FakeModelRepository();
  });

  it('creates a model under an existing brand', async () => {
    const brand = await brands.create('Samsung');
    const create = new CreateModelUseCase(models, brands);

    const model = await create.execute(brand.id, 'Galaxy A10');

    expect(model.brandId).toBe(brand.id);
    expect(model.name).toBe('Galaxy A10');
  });

  it('throws BrandNotFoundError creating a model for an unknown brand', async () => {
    const create = new CreateModelUseCase(models, brands);
    await expect(create.execute('missing', 'Galaxy A10')).rejects.toThrow(
      BrandNotFoundError,
    );
  });

  it('lists models for a brand', async () => {
    const brand = await brands.create('Samsung');
    await models.create(brand.id, 'Galaxy A10');
    await models.create(brand.id, 'Galaxy A20');

    const list = new ListModelsUseCase(models, brands);
    const result = await list.execute(brand.id);

    expect(result).toHaveLength(2);
  });

  it('updates a model name', async () => {
    const brand = await brands.create('Samsung');
    const model = await models.create(brand.id, 'Galaxy A10');

    const update = new UpdateModelUseCase(models);
    const updated = await update.execute(model.id, 'Galaxy A10s');

    expect(updated.name).toBe('Galaxy A10s');
  });

  it('throws ModelNotFoundError deleting an unknown model', async () => {
    const del = new DeleteModelUseCase(models);
    await expect(del.execute('missing')).rejects.toThrow(ModelNotFoundError);
  });
});
