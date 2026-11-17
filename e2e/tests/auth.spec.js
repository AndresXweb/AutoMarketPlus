// e2e/tests/auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth – Login / Registro', () => {
  test('la página de login carga y muestra el formulario', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /contraseña/i })).toBeVisible();
    await expect(page.locator('form').getByRole('button', { name: /^Entrar$/i })).toBeVisible();
  });

  test('el enlace de recuperar contraseña lleva a /recuperar', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /olvidaste tu contraseña/i }).click();

    await expect(page).toHaveURL(/\/recuperar/);
  });

  test('login con credenciales incorrectas no navega fuera de /login', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: /correo/i }).fill('usuario.inexistente@example.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('clave-incorrecta-123');
    await page.locator('form').getByRole('button', { name: /^Entrar$/i }).click();

    await page.waitForTimeout(2500);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
  });
});