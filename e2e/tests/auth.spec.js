// e2e/tests/auth.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from './support/pages/LoginPage.js';
import { uniqueUser } from './support/auth.js';

// Un test a la vez: evita carreras en el mismo dev server
test.describe.configure({ mode: 'serial' });

test.describe('Auth – Login / Registro', () => {
  test('la página de login carga y muestra el formulario', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /^Entrar$/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Correo$/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Contraseña$/i })).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

    test('doble clic en registro no debe crear dos cuentas', async ({ page }) => {
    const user = uniqueUser('dbl');
    const loginPage = new LoginPage(page);

    // Contar POST de sign-up
    let signUpCount = 0;
    await page.route('**/api/auth/**', async (route) => {
      const req = route.request();
      const url = req.url();
      const method = req.method();

      // Ajusta si tu ruta real es otra (sign-up/email, signup, etc.)
      const isSignUp =
        method === 'POST' &&
        (/sign-up/i.test(url) || /signup/i.test(url) || /register/i.test(url));

      if (isSignUp) {
        signUpCount += 1;
        // Simula red lenta para que el doble clic alcance a salir
        await new Promise((r) => setTimeout(r, 1500));
      }

      await route.continue();
    });

    await loginPage.goto();
    await loginPage.switchToRegister();

    await loginPage.firstName.fill(user.firstName);
    await loginPage.lastName.fill(user.lastName);
    await loginPage.documentNumber.fill(user.documentNumber);
    await loginPage.phone.fill(user.phone);
    await loginPage.email.fill(user.email);
    await loginPage.password.fill(user.password);
    await loginPage.confirmPassword.fill(user.password);
    await loginPage.terminosCheckbox.check();

    // Doble clic en el submit
    await loginPage.submitButton.dblclick();

    // Espera a que termine la petición lenta
    await expect(
      page.getByText(/cuenta creada|revisa tu correo|contraseñas|error|incorrectos/i),
    ).toBeVisible({ timeout: 20_000 });

    // Evidencia del defecto (o de que está protegido)
    // Ideal: 1 sola petición. Si sale 2, hay doble envío.
    expect(signUpCount).toBeLessThanOrEqual(1);
  });

  test('el enlace de recuperar contraseña lleva a /recuperar', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /olvidaste tu contraseña/i }).click();

    await expect(page).toHaveURL(/\/recuperar/);
  });

  test('login con credenciales incorrectas no navega fuera de /login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('usuario.inexistente@example.com', 'clave-incorrecta-123');

    // Mensaje real de login.tsx: setError(...) → <p className="text-sm text-danger">
    await expect(
      loginPage.errorMessage.or(
        page.getByText(/incorrectos|credenciales|no se pudo|inválid/i),
      ),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('registro exitoso con datos únicos', async ({ page }) => {
    const user = uniqueUser('reg');
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.register(user);

    // Toast Sonner: "Cuenta creada. Revisa tu correo..."
    await expect(
      page.getByText(/cuenta creada|revisa tu correo/i),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('registro falla si las contraseñas no coinciden', async ({ page }) => {
    const user = uniqueUser('reg-fail');
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.switchToRegister();

    await loginPage.firstName.fill(user.firstName);
    await loginPage.lastName.fill(user.lastName);
    await loginPage.documentNumber.fill(user.documentNumber);
    await loginPage.phone.fill(user.phone);
    await loginPage.email.fill(user.email);
    await loginPage.password.fill(user.password);
    await loginPage.confirmPassword.fill('OtraClaveDistinta999!');
    await loginPage.terminosCheckbox.check();
    await loginPage.submitButton.click();

    // Validación síncrona en onSubmit (no depende de API)
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5_000 });
    await expect(loginPage.errorMessage).toContainText(/contraseñas no coinciden/i);
    await expect(page).toHaveURL(/\/login/);
  });
});