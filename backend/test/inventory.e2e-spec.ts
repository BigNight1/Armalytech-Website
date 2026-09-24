import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

describe('Inventory (e2e)', () => {
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

  it('supports the full brand -> model -> part CRUD flow', async () => {
    const brandRes = await agent
      .post('/api/inventory/brands')
      .send({ name: 'Samsung' });
    expect(brandRes.status).toBe(201);
    const brandId = brandRes.body.data.id;

    const modelRes = await agent
      .post(`/api/inventory/brands/${brandId}/models`)
      .send({ name: 'Galaxy A10' });
    expect(modelRes.status).toBe(201);
    const modelId = modelRes.body.data.id;

    const partRes = await agent
      .post(`/api/inventory/models/${modelId}/parts`)
      .send({
        name: 'Pantalla',
        quantity: 5,
        purchasePrice: 10.5,
        salePrice: 25,
      });
    expect(partRes.status).toBe(201);
    const partId = partRes.body.data.id;
    expect(partRes.body.data.quantity).toBe(5);

    const listParts = await agent.get(`/api/inventory/models/${modelId}/parts`);
    expect(listParts.body.data).toHaveLength(1);

    const patchPart = await agent
      .patch(`/api/inventory/parts/${partId}`)
      .send({ quantity: 7 });
    expect(patchPart.status).toBe(200);
    expect(patchPart.body.data.quantity).toBe(7);

    const searchRes = await agent
      .get('/api/inventory/search')
      .query({ q: 'panta' });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data).toHaveLength(1);
    expect(searchRes.body.data[0].brandName).toBe('Samsung');

    const deleteBrand = await agent.delete(`/api/inventory/brands/${brandId}`);
    expect(deleteBrand.status).toBe(204);

    const modelsAfterCascade = await agent.get(
      `/api/inventory/brands/${brandId}/models`,
    );
    expect(modelsAfterCascade.status).toBe(404);
  });

  it('rejects a duplicate brand name (case-insensitive) with 409', async () => {
    await agent.post('/api/inventory/brands').send({ name: 'Apple' });
    const dup = await agent
      .post('/api/inventory/brands')
      .send({ name: 'apple' });

    expect(dup.status).toBe(409);
    expect(dup.body.ok).toBe(false);
  });

  it('returns 409 when adjusting a part below zero stock', async () => {
    const brandRes = await agent
      .post('/api/inventory/brands')
      .send({ name: 'Xiaomi' });
    const modelRes = await agent
      .post(`/api/inventory/brands/${brandRes.body.data.id}/models`)
      .send({ name: 'Redmi 9' });
    const partRes = await agent
      .post(`/api/inventory/models/${modelRes.body.data.id}/parts`)
      .send({ name: 'Bateria', quantity: 2, purchasePrice: 5, salePrice: 10 });
    const partId = partRes.body.data.id;

    const okAdjust = await agent
      .post(`/api/inventory/parts/${partId}/adjust`)
      .send({ delta: -2 });
    expect(okAdjust.status).toBe(200);
    expect(okAdjust.body.data.quantity).toBe(0);

    const failAdjust = await agent
      .post(`/api/inventory/parts/${partId}/adjust`)
      .send({ delta: -1 });
    expect(failAdjust.status).toBe(409);
  });
});
