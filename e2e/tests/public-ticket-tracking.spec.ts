import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  apiAsOwner,
  createTicket,
  DEFAULT_TICKET,
  patchEstado,
  type SeededTicket,
} from '../fixtures/api';

/**
 * The product's core promise (PRD "Objetivo / resultado esperado": el cliente
 * deja de escribir "¿ya está mi equipo?").
 *
 * A repair is registered in the panel, then the customer — with no account and
 * no password — finds that repair from the public site using only the ticket
 * code printed on their receipt plus the phone number they left. The status
 * page is the deliverable; everything else in the panel exists to feed it.
 *
 * Arrange goes through the REST API (that half is covered by the Jest e2e
 * suites in `backend/test/`); every assertion here is on what the customer
 * actually sees in a browser.
 */
test.describe('Rastreo público del ticket', () => {
  let api: APIRequestContext;
  let ticket: SeededTicket;

  test.beforeAll(async () => {
    api = await apiAsOwner();
    ticket = await createTicket(api);
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test('el cliente lo encuentra con código + celular y ve el estado de su equipo', async ({
    page,
  }) => {
    await page.goto('/consultar-ticket');

    await page.locator('#ticket-codigo').fill(ticket.codigo);
    await page.locator('#ticket-telefono').fill(DEFAULT_TICKET.telefono);
    await page.getByRole('button', { name: 'Consultar estado' }).click();

    // The lookup resolves to the ticket's opaque public token, never to a
    // sequential id (PRD "Casos borde": un enlace adivinable filtraría
    // tickets ajenos).
    await expect(page).toHaveURL(new RegExp(`/ticket/${ticket.publicToken}$`));

    await expect(
      page.getByRole('heading', { name: 'Recibimos tu equipo.', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(ticket.codigo, { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible();

    // The public page shows who the repair belongs to and what it costs —
    // the two things the customer actually calls to ask about.
    await expect(page.getByText('Lucía Ramírez')).toBeVisible();
    await expect(page.getByText('Samsung Galaxy A53')).toBeVisible();
    await expect(page.getByText('Costo acordado')).toBeVisible();
  });

  test('el código acepta el formato corto que el cliente dicta por teléfono', async ({ page }) => {
    // "1" must resolve to "AT-000001": lookupPublicTicket pads bare digits.
    const shortCode = ticket.codigo.replace(/^AT-0*/, '');

    await page.goto('/consultar-ticket');
    await page.locator('#ticket-codigo').fill(shortCode);
    await page.locator('#ticket-telefono').fill(DEFAULT_TICKET.telefono);
    await page.getByRole('button', { name: 'Consultar estado' }).click();

    await expect(page).toHaveURL(new RegExp(`/ticket/${ticket.publicToken}$`));
  });

  test('un celular equivocado no da acceso al ticket', async ({ page }) => {
    await page.goto('/consultar-ticket');

    await page.locator('#ticket-codigo').fill(ticket.codigo);
    await page.locator('#ticket-telefono').fill('999111222');
    await page.getByRole('button', { name: 'Consultar estado' }).click();

    await expect(page.getByText('No encontramos coincidencias')).toBeVisible();
    // Still on the lookup form: no ticket data leaked, no redirect.
    await expect(page).toHaveURL(/\/consultar-ticket$/);
  });

  test('el cliente ve el cambio de estado sin recargar la página', async ({ page }) => {
    // Own ticket, so moving its status cannot disturb the other tests.
    const api = await apiAsOwner();
    const tracked = await createTicket(api, {
      nombre: 'Ana',
      apellido: 'Torres',
      telefono: '955888777',
    });

    try {
      await page.goto(`/ticket/${tracked.publicToken}`);
      await expect(
        page.getByRole('heading', { name: 'Recibimos tu equipo.', exact: true }),
      ).toBeVisible();

      // The shop approves the repair. The customer's tab is NOT reloaded: the
      // page has to pick it up by itself (TicketPage polls REFRESH_MS, 2 s in
      // this mode). This is the "esta página se actualiza sola" promise.
      await patchEstado(api, tracked.id, 'aprobado');

      await expect(
        page.getByRole('heading', { name: 'Aprobaste el presupuesto.', exact: true }),
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await api.dispose();
    }
  });

  test('el enlace público no expone datos internos del taller', async ({ request }) => {    const res = await request.get(`/api/tickets/public/${ticket.publicToken}`);
    expect(res.ok()).toBeTruthy();

    const body = (await res.json()) as Record<string, unknown>;
    const serialized = JSON.stringify(body);

    // ADR 0006/0025: the public view carries no internal notes, no encrypted
    // device key and no customer phone number.
    expect(serialized).not.toContain('notasInternas');
    expect(serialized).not.toContain('claveEquipo');
    expect(serialized).not.toContain('telefono');
    expect(serialized).not.toContain(DEFAULT_TICKET.telefono);
  });

  test('un token inventado no revela ningún ticket', async ({ request }) => {
    const res = await request.get('/api/tickets/public/00000000-0000-4000-8000-000000000000');
    expect(res.status()).toBe(404);
  });

  test('el panel exige sesión: sin cookie, /api/tickets responde 401', async ({ request }) => {
    const res = await request.get('/api/tickets');
    expect(res.status()).toBe(401);
  });
});
