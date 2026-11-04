import { test, expect } from '@playwright/test';

test('enviar el formulario de contacto muestra la confirmación', async ({ page }) => {
  // Arrange
  const asunto = `Prueba E2E ${Date.now()}`;
  const nombre = page.getByRole('textbox', { name: 'Nombre' });
  await page.goto('/contacto');

  // Act: reintenta el llenado hasta que los valores se mantengan
  await expect(async () => {
    await nombre.fill('Usuario de prueba');
    await page.getByRole('textbox', { name: 'Correo' }).fill('prueba@example.com');
    await page.getByRole('textbox', { name: 'Teléfono' }).fill('3000000000');
    await page.getByRole('textbox', { name: 'Asunto' }).fill(asunto);
    await page.getByRole('textbox', { name: 'Mensaje' }).fill('Mensaje enviado por una prueba automática.');
    await expect(nombre).toHaveValue('Usuario de prueba');
  }).toPass({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Enviar' }).click();

  // Assert
  await expect(
    page.getByText('Gracias. Te respondemos al correo que dejaste.')
  ).toBeVisible({ timeout: 15_000 });
});