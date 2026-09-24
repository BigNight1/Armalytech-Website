import { SearchInventoryUseCase } from './search-inventory.use-case';
import { FakePartRepository } from './__tests__/fakes';

describe('SearchInventoryUseCase', () => {
  it('returns matching parts', async () => {
    const parts = new FakePartRepository();
    await parts.create('model-1', {
      name: 'Pantalla',
      quantity: 1,
      purchasePrice: 1,
      salePrice: 2,
    });

    const useCase = new SearchInventoryUseCase(parts);
    const result = await useCase.execute('panta');

    expect(result).toHaveLength(1);
  });

  it('returns an empty array for a blank query', async () => {
    const parts = new FakePartRepository();
    const useCase = new SearchInventoryUseCase(parts);

    expect(await useCase.execute('   ')).toEqual([]);
  });
});
