import { UpsertCashClosingRowUseCase } from './upsert-row.use-case';
import { FakeCashClosingRepository } from './__tests__/fakes';
import { ValidationDomainError } from '../../shared/domain/domain-error';

describe('UpsertCashClosingRowUseCase', () => {
  it('rounds money fields and upserts by (date, rowIndex)', async () => {
    const repo = new FakeCashClosingRepository();
    const useCase = new UpsertCashClosingRowUseCase(repo);

    const row = await useCase.execute('2026-09-23', 0, {
      cashIncome: 10.005,
      yapeIncome: 5,
      incomeDetail: 'venta',
      cashExpense: 0,
      yapeExpense: 0,
      expenseDetail: '',
    });

    expect(row.cashIncome).toBe(10.01);
    expect(repo.rows).toHaveLength(1);

    await useCase.execute('2026-09-23', 0, {
      cashIncome: 20,
      yapeIncome: 0,
      incomeDetail: '',
      cashExpense: 0,
      yapeExpense: 0,
      expenseDetail: '',
    });

    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0].cashIncome).toBe(20);
  });

  it('rejects an invalid date', async () => {
    const repo = new FakeCashClosingRepository();
    const useCase = new UpsertCashClosingRowUseCase(repo);

    await expect(
      useCase.execute('not-a-date', 0, {
        cashIncome: 0,
        yapeIncome: 0,
        incomeDetail: '',
        cashExpense: 0,
        yapeExpense: 0,
        expenseDetail: '',
      }),
    ).rejects.toThrow(ValidationDomainError);
  });
});
