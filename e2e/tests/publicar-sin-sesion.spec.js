import { test, expect } from '@playwright/test';

test('publicar sin sesión pide iniciar sesión', async ({ page }) => {
  // Arrange
  await page.goto('/publicar');

  // Assert: aparece login o botón Entrar
  await expect(
    page.getByRole('heading', { name: /entrar|cuenta|iniciar/i }).or(
      page.locator('form').getByRole('button', { name: 'Entrar' })
    ).first()
  ).toBeVisible({ timeout: 15_000 });
});
