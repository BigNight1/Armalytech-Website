import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

describe('Cash closings (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'super-secret',
    }));
    agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'super-secret' });
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  it('upserts a row via PUT, lists it, then deletes it', async () => {
    const putRes = await agent
      .put('/api/cash-closings/2026-09-23/rows/0')
      .send({
        cashIncome: 100,
        yapeIncome: 50.5,
        incomeDetail: 'venta repuestos',
        cashExpense: 20,
        yapeExpense: 0,
        expenseDetail: '',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.data.cashIncome).toBe(100);

    const putAgain = await agent
      .put('/api/cash-closings/2026-09-23/rows/0')
      .send({
        cashIncome: 200,
        yapeIncome: 0,
        incomeDetail: '',
        cashExpense: 0,
        yapeExpense: 0,
        expenseDetail: '',
      });
    expect(putAgain.status).toBe(200);

    const listRes = await agent
      .get('/api/cash-closings')
      .query({ from: '2026-09-01', to: '2026-09-30' });
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].cashIncome).toBe(200);

    const deleteRes = await agent.delete(
      '/api/cash-closings/2026-09-23/rows/0',
    );
    expect(deleteRes.status).toBe(204);

    const listAfterDelete = await agent
      .get('/api/cash-closings')
      .query({ from: '2026-09-01', to: '2026-09-30' });
    expect(listAfterDelete.body.data).toHaveLength(0);
  });

  it('returns a day/week/month summary with totals and net', async () => {
    await agent.put('/api/cash-closings/2026-09-23/rows/0').send({
      cashIncome: 100,
      yapeIncome: 0,
      incomeDetail: '',
      cashExpense: 40,
      yapeExpense: 0,
      expenseDetail: '',
    });

    const summaryRes = await agent
      .get('/api/cash-closings/summary')
      .query({ from: '2026-09-01', to: '2026-09-30', groupBy: 'day' });

    expect(summaryRes.status).toBe(200);
    const group = summaryRes.body.data.find(
      (g: { key: string }) => g.key === '2026-09-23',
    );
    expect(group.net).toBe(60);
  });
});
