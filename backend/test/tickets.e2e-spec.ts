import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createTestApp, closeTestApp } from './test-app';

/**
 * Today's calendar date in Lima (UTC-5, no DST), not UTC's — matters near
 * midnight UTC, when the two disagree, since `GET /api/cobros` filters by
 * Lima business day.
 */
function limaToday(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

describe('Tickets (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let owner: ReturnType<typeof request.agent>;
  let admin: ReturnType<typeof request.agent>;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    ({ app, mongod } = await createTestApp({
      ADMIN_USERNAME: 'owner',
      ADMIN_PASSWORD: 'super-secret-owner',
    }));

    owner = request.agent(app.getHttpServer());
    await owner
      .post('/api/auth/login')
      .send({ username: 'owner', password: 'super-secret-owner' });

    // Second, non-owner staff account (role "admin") to exercise the
    // owner-only guards (anular cobro, technician create/update).
    const staffRes = await owner.post('/api/staff').send({
      email: 'tecnico@armalytech.com',
      password: 'temporal123',
    });
    expect(staffRes.status).toBe(201);

    admin = request.agent(app.getHttpServer());
    await admin.post('/api/auth/login').send({
      email: 'tecnico@armalytech.com',
      password: 'temporal123',
    });

    const categoriesRes = await owner.get('/api/inventory/categories');
    categoryId = categoriesRes.body.data.find(
      (c: { name: string }) => c.name === 'Pantallas',
    ).id;

    const productRes = await owner.post('/api/inventory/products').send({
      categoryId,
      name: 'Pantalla A53 OLED',
      stock: 5,
      cost: 40,
      salePrice: 90,
      minStock: 1,
      compatiblePhoneIds: [],
    });
    expect(productRes.status).toBe(201);
    productId = productRes.body.data.id;
  });

  afterAll(async () => {
    await closeTestApp(app, mongod);
  });

  it('creates a ticket from a realistic intake form payload', async () => {
    const res = await owner.post('/api/tickets').send({
      cliente: {
        nombre: 'Andrea',
        apellido: 'Salazar',
        telefono: '+51 987 654 321',
      },
      equipo: {
        marca: 'Samsung',
        modelo: 'Galaxy A53',
        color: 'Negro',
        imei: '356789101234567',
        fallaReportada: 'Pantalla rota tras caída',
        estadoIngreso: 'Enciende, táctil no responde en la mitad inferior',
      },
      claveEquipo: { tipo: 'pin', valor: '1234' },
      titulo: 'Cambio de pantalla A53',
      notaCliente: 'Se recomienda mica templada de regalo',
      notasInternas: ['Cliente pidió factura'],
      piezas: [
        {
          productoId: productId,
          nombre: 'Pantalla A53 OLED',
          categoria: 'Pantallas',
          cantidad: 1,
          costoUnitario: 40,
          precioVentaUnitario: 90,
        },
      ],
      precioTotal: 150,
      adelanto: 50,
      metodoAdelanto: 'yape',
      fechaEntregaEstimada: '2026-10-02',
    });

    expect(res.status).toBe(201);
    expect(res.body.codigo).toBe('AT-000001');
    expect(res.body.estado).toBe('pendiente');
    expect(res.body.saldo).toBe(100);
    expect(res.body.piezas[0].estado).toBe('planificada');
    // Digits-only storage so `GET /tickets?q=987654321` matches regardless
    // of how the phone was typed.
    expect(res.body.cliente.telefono).toBe('51987654321');

    // Adelanto was recorded as a cobro, with the real ticket id as
    // referenciaId and its human code as codigo.
    const today = limaToday();
    const cobrosRes = await owner
      .get('/api/cobros')
      .query({ from: today, to: today });
    expect(cobrosRes.status).toBe(200);
    const adelantoCobro = cobrosRes.body.find(
      (c: { tipo: string }) => c.tipo === 'adelanto',
    );
    expect(adelantoCobro).toBeDefined();
    expect(adelantoCobro.referenciaId).toBe(res.body.id);
    expect(adelantoCobro.codigo).toBe('AT-000001');
    expect(adelantoCobro.monto).toBe(50);
    expect(adelantoCobro.metodo).toBe('yape');
    expect(adelantoCobro.anulado).toBe(false);
  });

  it('finds the ticket by raw phone digits', async () => {
    const res = await owner.get('/api/tickets').query({ q: '987654321' });
    expect(res.status).toBe(200);
    expect(res.body.tickets.map((t: { codigo: string }) => t.codigo)).toContain(
      'AT-000001',
    );
  });

  // 2026-10-25 hardening (C5): the public lookup had no DTO, so a non-string
  // `codigo` reached the use case and surfaced as a 500.
  it('validates the public lookup body: invalid input is a 400 with a Spanish message, never a 500', async () => {
    const anon = request(app.getHttpServer());

    const numericCodigo = await anon
      .post('/api/tickets/public/lookup')
      .send({ codigo: 1, telefono: '987654321' });
    expect(numericCodigo.status).toBe(400);
    expect(numericCodigo.body.ok).toBe(false);
    const message = Array.isArray(numericCodigo.body.error.message)
      ? numericCodigo.body.error.message.join(' | ')
      : numericCodigo.body.error.message;
    expect(message).toMatch(/texto/);

    const missingPhone = await anon
      .post('/api/tickets/public/lookup')
      .send({ codigo: 'AT-000001' });
    expect(missingPhone.status).toBe(400);
    expect(missingPhone.body.ok).toBe(false);

    const overlongCodigo = await anon
      .post('/api/tickets/public/lookup')
      .send({ codigo: 'A'.repeat(41), telefono: '987654321' });
    expect(overlongCodigo.status).toBe(400);

    // Functional behavior is unchanged: both values are still required and the
    // phone is still normalized to digits before matching.
    const found = await anon
      .post('/api/tickets/public/lookup')
      .send({ codigo: '1', telefono: '+51 987 654 321' });
    expect(found.status).toBe(200);
    expect(found.body.codigo).toBe('AT-000001');
    expect(typeof found.body.publicToken).toBe('string');
  });

  it('still answers 400 (not 500) for an empty lookup body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tickets/public/lookup')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('exposes availability with stock, planificado and reservas, honoring excludeTicketId', async () => {
    const ticketRes = await owner.get('/api/tickets').query({ q: 'AT-000001' });
    const ticketId = ticketRes.body.tickets[0].id;

    const availabilityRes = await owner
      .get('/api/tickets/availability')
      .query({ categoriaId: categoryId });
    expect(availabilityRes.status).toBe(200);
    const item = availabilityRes.body.find(
      (p: { productoId: string }) => p.productoId === productId,
    );
    expect(item.stock).toBe(5);
    expect(item.planificado).toBe(1);
    expect(item.disponible).toBe(4);
    expect(item.reservas).toEqual([
      expect.objectContaining({
        ticketId,
        codigo: 'AT-000001',
        cliente: 'Andrea Salazar',
      }),
    ]);

    const excludedRes = await owner
      .get('/api/tickets/availability')
      .query({ categoriaId: categoryId, excludeTicketId: ticketId });
    const excludedItem = excludedRes.body.find(
      (p: { productoId: string }) => p.productoId === productId,
    );
    expect(excludedItem.planificado).toBe(0);
    expect(excludedItem.disponible).toBe(5);
    expect(excludedItem.reservas).toEqual([]);
  });

  it('approves a ticket, discounts stock atomically, and 409s with faltantes when stock is short', async () => {
    const listRes = await owner.get('/api/tickets').query({ q: 'AT-000001' });
    const ticketId = listRes.body.tickets[0].id;

    const approveRes = await owner
      .patch(`/api/tickets/${ticketId}/status`)
      .send({
        nuevoEstado: 'aprobado',
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.piezas[0].estado).toBe('descontada');

    const productRes = await owner.get(`/api/inventory/products/${productId}`);
    expect(productRes.body.data.stock).toBe(4);

    // A second ticket that needs more of the same part than is left in
    // stock (4) must be rejected atomically, with no partial decrement.
    const secondTicketRes = await owner.post('/api/tickets').send({
      cliente: { nombre: 'Bruno', telefono: '944555666' },
      equipo: { fallaReportada: 'Pantalla estrellada' },
      titulo: 'Cambio de pantalla',
      piezas: [
        {
          productoId: productId,
          nombre: 'Pantalla A53 OLED',
          cantidad: 10,
        },
      ],
      precioTotal: 200,
    });
    expect(secondTicketRes.status).toBe(201);
    const secondTicketId = secondTicketRes.body.id;

    const failedApprove = await owner
      .patch(`/api/tickets/${secondTicketId}/status`)
      .send({ nuevoEstado: 'aprobado' });

    expect(failedApprove.status).toBe(409);
    expect(failedApprove.body.ok).toBe(false);
    expect(failedApprove.body.error.code).toBe('insufficient_stock');
    expect(failedApprove.body.error.faltantes).toEqual([
      expect.objectContaining({
        productoId: productId,
        nombre: 'Pantalla A53 OLED',
        necesita: 10,
        hay: 4,
      }),
    ]);

    // Ticket and stock are unchanged after the 409.
    const secondTicketAfter = await owner.get(`/api/tickets/${secondTicketId}`);
    expect(secondTicketAfter.body.estado).toBe('pendiente');
    expect(secondTicketAfter.body.piezas[0].estado).toBe('planificada');
    const productAfterFail = await owner.get(
      `/api/inventory/products/${productId}`,
    );
    expect(productAfterFail.body.data.stock).toBe(4);
  });

  it('walks a ticket to entregado; the saldo cobro amount is server-computed and ignores any client amount', async () => {
    const listRes = await owner.get('/api/tickets').query({ q: 'AT-000001' });
    const ticketId = listRes.body.tickets[0].id;

    await owner
      .patch(`/api/tickets/${ticketId}/status`)
      .send({ nuevoEstado: 'trabajando' })
      .expect(200);
    await owner
      .patch(`/api/tickets/${ticketId}/status`)
      .send({ nuevoEstado: 'listo' })
      .expect(200);

    const entregarRes = await owner
      .patch(`/api/tickets/${ticketId}/status`)
      .send({
        nuevoEstado: 'entregado',
        // A client-supplied `monto` (if the frontend ever sent one) must be
        // ignored; the server always computes precioTotal - cobros previos.
        cobro: { metodo: 'efectivo', monto: 999999 },
      });

    expect(entregarRes.status).toBe(200);
    expect(entregarRes.body.saldo).toBe(0);
    // Device key is wiped on delivery.
    expect(entregarRes.body.claveEquipo.tipo).toBe('ninguno');

    const today = limaToday();
    const cobrosRes = await owner
      .get('/api/cobros')
      .query({ from: today, to: today });
    const saldoCobro = cobrosRes.body.find(
      (c: { tipo: string; referenciaId: string }) =>
        c.tipo === 'saldo' && c.referenciaId === ticketId,
    );
    expect(saldoCobro).toBeDefined();
    expect(saldoCobro.monto).toBe(100); // 150 - 50 adelanto, never 999999
    expect(saldoCobro.metodo).toBe('efectivo');
  });

  it('reveals the device key with an audit trail entry, and never exposes it publicly', async () => {
    // A fresh ticket, since the first one's key was wiped on delivery above.
    const createRes = await owner.post('/api/tickets').send({
      cliente: { nombre: 'Carla', telefono: '955666777' },
      equipo: { fallaReportada: 'No enciende' },
      claveEquipo: { tipo: 'patron', valor: '1-5-9-6' },
      titulo: 'Diagnóstico',
      precioTotal: 60,
    });
    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.id;
    const publicToken = createRes.body.publicToken;

    const revealRes = await owner.post(`/api/tickets/${ticketId}/reveal-clave`);
    expect(revealRes.status).toBe(200);
    expect(revealRes.body.tipo).toBe('patron');
    expect(revealRes.body.valor).toBe('1-5-9-6');

    const ticketDetail = await owner.get(`/api/tickets/${ticketId}`);
    expect(ticketDetail.body.auditoriaClave).toHaveLength(1);
    expect(ticketDetail.body.auditoriaClave[0].usuarioEmail).toBe(
      'owner@armalytech.com',
    );

    const publicRes = await request(app.getHttpServer()).get(
      `/api/tickets/public/${publicToken}`,
    );
    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toEqual(
      expect.objectContaining({
        codigo: createRes.body.codigo,
        estado: 'pendiente',
        titulo: 'Diagnóstico',
      }),
    );
    expect(publicRes.body.claveEquipo).toBeUndefined();
    expect(publicRes.body.notasInternas).toBeUndefined();
    expect(publicRes.body.cliente.telefono).toBeUndefined();
    expect(publicRes.body.auditoriaClave).toBeUndefined();
  });

  // 2026-10-25 hardening (C10/R-06): the internal-note route read `@Body('nota')`
  // raw, so an empty or unbounded note was accepted.
  it('rejects an empty, missing or oversized internal note with 400, and still stores a valid one', async () => {
    const createRes = await owner.post('/api/tickets').send({
      cliente: { nombre: 'Notas', telefono: '966777888' },
      equipo: { fallaReportada: 'Revisión general' },
      titulo: 'Notas internas',
      precioTotal: 0,
    });
    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.id;

    const empty = await owner
      .post(`/api/tickets/${ticketId}/notas`)
      .send({ nota: '' });
    expect(empty.status).toBe(400);
    expect(empty.body.ok).toBe(false);
    const message = Array.isArray(empty.body.error.message)
      ? empty.body.error.message.join(' | ')
      : empty.body.error.message;
    expect(message).toMatch(/Ingresa el contenido de la nota/);

    const missing = await owner.post(`/api/tickets/${ticketId}/notas`).send({});
    expect(missing.status).toBe(400);

    const oversized = await owner
      .post(`/api/tickets/${ticketId}/notas`)
      .send({ nota: 'x'.repeat(2001) });
    expect(oversized.status).toBe(400);
    expect(oversized.body.ok).toBe(false);

    const valid = await owner
      .post(`/api/tickets/${ticketId}/notas`)
      .send({ nota: 'Cliente avisado por WhatsApp' });
    expect(valid.status).toBe(201);
    expect(valid.body.notasInternas).toContain(
      '[owner@armalytech.com] Cliente avisado por WhatsApp',
    );
  });

  it('lets only the owner annul a cobro; the admin gets 403', async () => {
    const today = limaToday();
    const cobrosRes = await owner
      .get('/api/cobros')
      .query({ from: today, to: today });
    const cobro = cobrosRes.body.find(
      (c: { tipo: string }) => c.tipo === 'adelanto',
    );
    expect(cobro).toBeDefined();

    const forbidden = await admin
      .post(`/api/cobros/${cobro.id}/anular`)
      .send({ motivo: 'Intento no autorizado' });
    expect(forbidden.status).toBe(403);

    const annulled = await owner
      .post(`/api/cobros/${cobro.id}/anular`)
      .send({ motivo: 'Cliente pagó en efectivo, no yape' });
    expect(annulled.status).toBe(200);
    expect(annulled.body.anulado).toBe(true);
    expect(annulled.body.motivoAnulacion).toBe(
      'Cliente pagó en efectivo, no yape',
    );

    // Still present (soft-annulled), not deleted.
    const afterRes = await owner
      .get('/api/cobros')
      .query({ from: today, to: today });
    const stillThere = afterRes.body.find(
      (c: { id: string }) => c.id === cobro.id,
    );
    expect(stillThere).toBeDefined();
    expect(stillThere.anulado).toBe(true);
  });

  it('technicians: GET shape includes ticketsEnCurso; create/update are owner-only', async () => {
    const listRes = await owner.get('/api/technicians');
    expect(listRes.status).toBe(200);
    expect(listRes.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nombre: expect.any(String),
        activo: true,
        ticketsEnCurso: expect.any(Number),
      }),
    );

    const forbiddenCreate = await admin
      .post('/api/technicians')
      .send({ nombre: 'Nuevo Técnico' });
    expect(forbiddenCreate.status).toBe(403);

    const created = await owner
      .post('/api/technicians')
      .send({ nombre: 'Nuevo Técnico' });
    expect(created.status).toBe(201);
    expect(created.body).toEqual(
      expect.objectContaining({
        nombre: 'Nuevo Técnico',
        activo: true,
        ticketsEnCurso: 0,
      }),
    );

    const forbiddenUpdate = await admin
      .patch(`/api/technicians/${created.body.id}`)
      .send({ activo: false });
    expect(forbiddenUpdate.status).toBe(403);

    const updated = await owner
      .patch(`/api/technicians/${created.body.id}`)
      .send({ nombre: 'Técnico Renombrado', activo: false });
    expect(updated.status).toBe(200);
    expect(updated.body.nombre).toBe('Técnico Renombrado');
    expect(updated.body.activo).toBe(false);
  });
});
