import { GetCashClosingsSummaryUseCase } from './get-summary.use-case';
import { FakeCashClosingRepository } from './__tests__/fakes';

describe('GetCashClosingsSummaryUseCase', () => {
  it('groups by day and computes net income minus expense', async () => {
    const repo = new FakeCashClosingRepository();
    await repo.upsert('2026-09-23', 0, {
      cashIncome: 100,
      yapeIncome: 50,
      incomeDetail: '',
      cashExpense: 30,
      yapeExpense: 0,
      expenseDetail: '',
    });

    const useCase = new GetCashClosingsSummaryUseCase(repo);
    const summary = await useCase.execute('2026-09-01', '2026-09-30', 'day');

    expect(summary).toEqual([
      {
        key: '2026-09-23',
        cashIncome: 100,
        yapeIncome: 50,
        cashExpense: 30,
        yapeExpense: 0,
        net: 120,
      },
    ]);
  });

  it('groups by month across multiple days', async () => {
    const repo = new FakeCashClosingRepository();
    await repo.upsert('2026-09-01', 0, {
      cashIncome: 10,
      yapeIncome: 0,
      incomeDetail: '',
      cashExpense: 0,
      yapeExpense: 0,
      expenseDetail: '',
    });
    await repo.upsert('2026-09-15', 0, {
      cashIncome: 20,
      yapeIncome: 0,
      incomeDetail: '',
      cashExpense: 0,
      yapeExpense: 0,
      expenseDetail: '',
    });

    const useCase = new GetCashClosingsSummaryUseCase(repo);
    const summary = await useCase.execute('2026-09-01', '2026-09-30', 'month');

    expect(summary).toHaveLength(1);
    expect(summary[0].key).toBe('2026-09');
    expect(summary[0].cashIncome).toBe(30);
  });

  it('groups by ISO week (Monday start)', async () => {
    const repo = new FakeCashClosingRepository();
    // 2026-09-23 is a Wednesday; the week starts Monday 2026-09-21.
    await repo.upsert('2026-09-23', 0, {
      cashIncome: 5,
      yapeIncome: 0,
      incomeDetail: '',
      cashExpense: 0,
      yapeExpense: 0,
      expenseDetail: '',
    });

    const useCase = new GetCashClosingsSummaryUseCase(repo);
    const summary = await useCase.execute('2026-09-01', '2026-09-30', 'week');

    expect(summary[0].key).toBe('2026-09-21');
  });
});
