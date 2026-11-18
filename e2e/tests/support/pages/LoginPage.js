// e2e/tests/support/pages/LoginPage.js
export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
    await this.page
      .getByRole('heading', { name: /^Entrar$/i })
      .waitFor({ state: 'visible' });
  }

  // Solo pestañas (type=button) dentro de main — evita nav y submit
  get tabEntrar() {
    return this.page
      .locator('main')
      .locator('button[type="button"]')
      .filter({ hasText: /^Entrar$/i });
  }

  get tabCrear() {
    return this.page
      .locator('main')
      .locator('button[type="button"]')
      .filter({ hasText: /^Crear cuenta$/i });
  }

  get email() {
    return this.page.getByRole('textbox', { name: /^Correo$/i });
  }

  get password() {
    return this.page.getByRole('textbox', { name: /^Contraseña$/i });
  }

  get confirmPassword() {
    return this.page.getByRole('textbox', { name: /Confirmar contraseña/i });
  }

  get firstName() {
    return this.page.getByRole('textbox', { name: /^Nombres$/i });
  }

  get lastName() {
    return this.page.getByRole('textbox', { name: /^Apellidos$/i });
  }

  get phone() {
    return this.page.getByRole('textbox', { name: /^Teléfono$/i });
  }

  get documentNumber() {
    return this.page.getByRole('textbox', { name: /^Número$/i });
  }

  get terminosCheckbox() {
    return this.page
      .locator('form label')
      .filter({ hasText: /términos y condiciones/i })
      .locator('input[type="checkbox"]');
  }

  get submitButton() {
    return this.page.locator('form button[type="submit"]');
  }

  get errorMessage() {
    return this.page.locator('p.text-danger');
  }

  async switchToLogin() {
    const onRegister = await this.page
      .getByRole('heading', { name: /^Crear cuenta$/i })
      .isVisible()
      .catch(() => false);
    if (!onRegister) return;

    await this.tabEntrar.click();
    await this.page
      .getByRole('heading', { name: /^Entrar$/i })
      .waitFor({ state: 'visible', timeout: 10_000 });
  }

  async switchToRegister() {
    await this.tabCrear.waitFor({ state: 'visible' });

    // Reintento: el primer click a veces no aplica setMode en React
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.tabCrear.click();
      try {
        await this.page
          .getByRole('heading', { name: /^Crear cuenta$/i })
          .waitFor({ state: 'visible', timeout: 5_000 });
        await this.firstName.waitFor({ state: 'visible', timeout: 3_000 });
        return;
      } catch {
        if (attempt === 3) {
          throw new Error('No se pudo cambiar a la pestaña Crear cuenta tras 3 intentos');
        }
      }
    }
  }

  async login(email, password) {
    // goto() deja mode === "entrar"; no hace falta tocar pestañas
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }

  async register({ email, password, firstName, lastName, phone, documentNumber }) {
    await this.switchToRegister();
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.documentNumber.fill(documentNumber);
    await this.phone.fill(phone);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.confirmPassword.fill(password);
    await this.terminosCheckbox.check();
    await this.submitButton.click();
  }
}