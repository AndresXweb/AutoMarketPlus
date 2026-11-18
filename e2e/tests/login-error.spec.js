import { test, expect } from '@playwright/test';

test('login con contraseña incorrecta muestra error', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act
  await page.getByRole('textbox', { name: 'Correo' }).fill('usuario.inexistente@example.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('clave-incorrecta-123');
  await page.locator('form').getByRole('button', { name: 'Entrar' }).click();

  // Assert: mensaje de error (párrafo danger o toast)
  await expect(
    page.locator('p.text-danger')
      .or(page.getByText(/incorrectos|inválid|error|falló|no se pudo|credenciales/i))
  ).toBeVisible({ timeout: 15_000 });
});