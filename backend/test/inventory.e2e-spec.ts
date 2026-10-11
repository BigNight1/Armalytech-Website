import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

describe('Inventory v2 (e2e)', () => {
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

  it('seeds the default categories on bootstrap', async () => {
    const res = await agent.get('/api/inventory/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { name: string }) => c.name)).toEqual(
      expect.arrayContaining(['Pantallas', 'Repuestos', 'Cargadores']),
    );
  });

  it('supports the full brand -> phone -> product -> adjust -> movements flow', async () => {
    const brandRes = await agent
      .post('/api/inventory/brands')
      .send({ name: 'Samsung' });
    expect(brandRes.status).toBe(201);
    const brandId = brandRes.body.data.id;

    const phoneRes = await agent
      .post('/api/inventory/phones')
      .send({ brandId, name: 'Galaxy A54' });
    expect(phoneRes.status).toBe(201);
    const phoneId = phoneRes.body.data.id;

    const categoriesRes = await agent.get('/api/inventory/categories');
    const category = categoriesRes.body.data.find(
      (c: { name: string }) => c.name === 'Micas',
    );

    const productRes = await agent.post('/api/inventory/products').send({
      categoryId: category.id,
      name: 'Mica templada',
      stock: 5,
      cost: 3.5,
      salePrice: 8,
      minStock: 2,
      compatiblePhoneIds: [phoneId],
    });
    expect(productRes.status).toBe(201);
    const product = productRes.body.data;
    expect(product.stock).toBe(5);
    expect(product.category).toEqual({ id: category.id, name: 'Micas' });
    expect(product.compatiblePhones).toEqual([
      { id: phoneId, name: 'Galaxy A54', brandName: 'Samsung' },
    ]);

    // "Stock inicial" movement was written by the create.
    const initialMovements = await agent.get(
      `/api/inventory/products/${product.id}/movements`,
    );
    expect(initialMovements.body.data.total).toBe(1);
    expect(initialMovements.body.data.items[0].reason).toBe('Stock inicial');
    expect(initialMovements.body.data.items[0].type).toBe('ajuste_entrada');

    // Search by phone name ("A54") finds the compatible product.
    const searchRes = await agent
      .get('/api/inventory/products')
      .query({ q: 'a54' });
    expect(searchRes.status).toBe(200);
    expect(
      searchRes.body.data.items.map((p: { id: string }) => p.id),
    ).toContain(product.id);
    expect(searchRes.body.data.matchedPhones[0].name).toBe('Galaxy A54');

    // PATCH updates fields but never stock.
    const patchRes = await agent
      .patch(`/api/inventory/products/${product.id}`)
      .send({ salePrice: 9.5 });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.salePrice).toBe(9.5);
    expect(patchRes.body.data.stock).toBe(5);

    // Adjust upward.
    const adjustUp = await agent
      .post(`/api/inventory/products/${product.id}/adjust`)
      .send({ delta: 3, reason: 'Llegada de mercadería' });
    expect(adjustUp.status).toBe(200);
    expect(adjustUp.body.data.stock).toBe(8);

    // Adjust below zero -> 409, no partial movement written.
    const failAdjust = await agent
      .post(`/api/inventory/products/${product.id}/adjust`)
      .send({ delta: -100 });
    expect(failAdjust.status).toBe(409);

    const movementsAfter = await agent.get(
      `/api/inventory/products/${product.id}/movements`,
    );
    expect(movementsAfter.body.data.total).toBe(2);
    expect(movementsAfter.body.data.items[0].quantity).toBe(3);

    // Archive hides it from the default listing, restore brings it back.
    const archiveRes = await agent.delete(
      `/api/inventory/products/${product.id}`,
    );
    expect(archiveRes.status).toBe(204);

    const listAfterArchive = await agent.get('/api/inventory/products');
    expect(
      listAfterArchive.body.data.items.map((p: { id: string }) => p.id),
    ).not.toContain(product.id);

    const listIncludingArchived = await agent
      .get('/api/inventory/products')
      .query({ includeArchived: 'true' });
    expect(
      listIncludingArchived.body.data.items.map((p: { id: string }) => p.id),
    ).toContain(product.id);

    const restoreRes = await agent.post(
      `/api/inventory/products/${product.id}/restore`,
    );
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.active).toBe(true);

    // No cascade: referenced brand/phone/category cannot be deleted.
    const deletePhone = await agent.delete(`/api/inventory/phones/${phoneId}`);
    expect(deletePhone.status).toBe(409);

    const deleteCategory = await agent.delete(
      `/api/inventory/categories/${category.id}`,
    );
    expect(deleteCategory.status).toBe(409);

    const deleteBrand = await agent.delete(`/api/inventory/brands/${brandId}`);
    expect(deleteBrand.status).toBe(409);
  });

  it('rejects a duplicate brand name (case-insensitive) with 409', async () => {
    await agent.post('/api/inventory/brands').send({ name: 'Apple' });
    const dup = await agent
      .post('/api/inventory/brands')
      .send({ name: 'apple' });

    expect(dup.status).toBe(409);
    expect(dup.body.ok).toBe(false);
  });

  it('rejects a duplicate phone name within the same brand with 409', async () => {
    const brandRes = await agent
      .post('/api/inventory/brands')
      .send({ name: 'Xiaomi' });
    const brandId = brandRes.body.data.id;
    await agent
      .post('/api/inventory/phones')
      .send({ brandId, name: 'Redmi 9' });

    const dup = await agent
      .post('/api/inventory/phones')
      .send({ brandId, name: 'redmi 9' });

    expect(dup.status).toBe(409);
  });

  it('404s when creating a product against a category that does not exist', async () => {
    const res = await agent.post('/api/inventory/products').send({
      categoryId: '64b7f0f0f0f0f0f0f0f0f0f0',
      name: 'X',
      stock: 0,
      cost: 1,
      salePrice: 2,
      minStock: 0,
    });
    expect(res.status).toBe(404);
  });
});
