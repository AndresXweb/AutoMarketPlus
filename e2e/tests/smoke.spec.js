import { test, expect } from '@playwright/test';

test('la página principal responde', async ({ page }) => {
  const respuesta = await page.goto('/');
  expect(respuesta.ok()).toBeTruthy();
});