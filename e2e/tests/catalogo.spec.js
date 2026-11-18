/**
 * Semana 6 — Capa E2E
 * Flujo: visitar el catálogo y verificar carga correcta.
 */
import { test, expect } from "@playwright/test";

test.describe("Catálogo de vehículos", () => {
  test("la página /catalogo carga y muestra contenido", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page).toHaveURL(/catalogo/);
    await expect(page.locator("body")).toBeVisible();

    const hasContent = await page
      .locator("h1, h2, [data-testid], article, .grid, main")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test("el catálogo no muestra error de servidor", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page.getByText(/internal server error/i)).toHaveCount(0);
    await expect(page.getByText(/algo salió mal/i)).toHaveCount(0);
  });
});
