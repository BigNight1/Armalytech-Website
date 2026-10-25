import { test, expect } from '@playwright/test';
import { apiAsOwner, createTicket } from '../fixtures/api';
import { ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_STATE_PATH } from '../fixtures/env';

/**
 * The other half of the same promise: an operator can move a repair forward
 * from the panel without touching the database, and the customer's private
 * link reflects it.
 *
 * The first spec starts from the session cookie captured in `global-setup.ts`
 * (so the login throttle is not exercised by every test) and drives the real
 * UI: inbox → detail drawer → approve → start work. It then opens the
 * customer's public page in a *separate, unauthenticated* browser context, so
 * the assertion cannot pass just because an admin session is still around.
 */
test.describe('Panel: flujo de taller', () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test('el admin aprueba e inicia la reparación, y el cliente lo ve en su enlace', async ({
    page,
    browser,
  }) => {
    // Arrange: a repair already registered at the counter.
    const api = await apiAsOwner();
    const ticket = await createTicket(api, {
      nombre: 'Marco',
      apellido: 'Quispe',
      telefono: '912345678',
      marca: 'Xiaomi',
      modelo: 'Redmi Note 12',
      falla: 'No carga desde ayer, el puerto está flojo.',
      titulo: 'Cambio de puerto de carga Redmi Note 12',
      precioTotal: 120,
    });

    try {
      // Act 1 — the protected route renders for an authenticated operator.
      await page.goto('/admin/tickets');
      await expect(page.getByRole('heading', { name: 'Tickets', level: 1 })).toBeVisible();

      // Act 2 — open the ticket from the inbox.
      const codigoCell = page.getByRole('cell', { name: ticket.codigo, exact: true });
      await expect(codigoCell).toBeVisible();
      await codigoCell.click();

      const drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText(ticket.codigo, { exact: false }).first()).toBeVisible();
      await expect(drawer.getByText('Marco Quispe')).toBeVisible();

      // Act 3 — approve, then start the repair. These two transitions are the
      // ones that change what the customer is told.
      await drawer.getByRole('button', { name: 'Aprobar reparación' }).click();
      await expect(page.getByRole('heading', { name: 'Aprobar ticket' })).toBeVisible();
      await page.getByRole('button', { name: 'Aprobar y descontar' }).click();

      // Assert on the transition buttons, not on the status label.
      //
      // The label is NOT a safe anchor: once the ticket is approved, "Aprobado"
      // appears twice inside the drawer (the status badge and the timeline
      // entry), and Playwright's strict mode refuses to pick one. It also raced
      // in CI, where the timeline repaints before the assertion runs. Which
      // transition button is offered is a function of the state (ADR 0007), so
      // it is unambiguous: "Iniciar trabajo" only exists in `aprobado` and
      // "Marcar como listo" only exists in `trabajando`.
      await expect(drawer.getByRole('button', { name: 'Iniciar trabajo' })).toBeVisible();
      await drawer.getByRole('button', { name: 'Iniciar trabajo' }).click();
      await expect(drawer.getByRole('button', { name: 'Marcar como listo' })).toBeVisible();

      // Assert — the customer's view, with no session at all.
      const clientContext = await browser.newContext();
      const clientPage = await clientContext.newPage();
      try {
        await clientPage.goto(`/ticket/${ticket.publicToken}`);
        await expect(
          clientPage.getByRole('heading', {
            name: 'Tu equipo está en reparación.',
            exact: true,
          }),
        ).toBeVisible();
        await expect(clientPage.getByText('Trabajando', { exact: true }).first()).toBeVisible();
        await expect(clientPage.getByText(ticket.codigo, { exact: false }).first()).toBeVisible();
      } finally {
        await clientContext.close();
      }
    } finally {
      await api.dispose();
    }
  });
});

/**
 * Access control on the same panel. These run *without* the stored session.
 * Only two specs touch `POST /api/auth/login` (plus `global-setup.ts`), which
 * keeps the whole run under the backend's 5/minute throttle.
 */
test.describe('Panel: acceso', () => {
  test('sin sesión, /admin/tickets redirige al login', async ({ page }) => {
    await page.goto('/admin/tickets');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });

  test('el owner inicia sesión con el formulario y llega al panel', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill(ADMIN_EMAIL);
    await page.locator('#login-password').fill(ADMIN_PASSWORD);

    // Wait for the round-trip before asserting on the next page: navigating
    // immediately would abort the in-flight request and lose the cookie.
    const loginResponse = page.waitForResponse(
      (res) => res.url().includes('/api/auth/login') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Ingresar al panel' }).click();
    expect((await loginResponse).status()).toBe(200);

    await expect(page).toHaveURL(/\/admin\/inventario$/);
    await expect(page.getByRole('heading', { name: 'Inventario', level: 1 })).toBeVisible();
  });

  test('el panel rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill(ADMIN_EMAIL);
    await page.locator('#login-password').fill('contrasena-que-no-es');
    await page.getByRole('button', { name: 'Ingresar al panel' }).click();

    // Stays on the login screen and surfaces the backend's message.
    await expect(page).toHaveURL(/\/admin\/login$/);
    // NOTE: the backend currently rejects with the English copy
    // "Invalid username or password" (`auth.errors.ts`) while the rest of the
    // panel is Spanish. The regex accepts either so translating the message
    // later does not break this test.
    await expect(
      page.getByText(/Invalid username or password|Credenciales inv[áa]lidas/i),
    ).toBeVisible();
  });
});
