// e2e/tests/support/pages/LoginPage.js
export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.getByRole('textbox', { name: /correo/i }).waitFor({ state: 'visible' });
  }

  get tabEntrar() {
    return this.page.getByRole('button', { name: /^Entrar$/i });
  }

  get tabCrear() {
    return this.page.getByRole('button', { name: /Crear cuenta/i });
  }

  get email() {
    return this.page.getByRole('textbox', { name: /correo/i });
  }

  get password() {
    return this.page.getByRole('textbox', { name: /^Contraseña$/i });
  }

  get confirmPassword() {
    return this.page.getByRole('textbox', { name: /Confirmar contraseña/i });
  }

  get firstName() {
    return this.page.getByRole('textbox', { name: /Nombres/i });
  }

  get lastName() {
    return this.page.getByRole('textbox', { name: /Apellidos/i });
  }

  get phone() {
    return this.page.getByRole('textbox', { name: /Teléfono/i });
  }

  get documentNumber() {
    return this.page.getByRole('textbox', { name: /^Número$/i });
  }

  get terminosCheckbox() {
    // Más resistente: busca el checkbox dentro del label de términos
    return this.page.locator('label').filter({ hasText: /términos/i }).locator('input[type="checkbox"]');
  }

  get submitButton() {
    return this.page.locator('form').getByRole('button', { name: /Entrar|Crear cuenta/i });
  }

  get errorMessage() {
    return this.page
      .locator('p.text-danger')
      .or(this.page.locator('.text-danger'))
      .or(this.page.getByText(/incorrectos|inválid|error|falló|no se pudo|credenciales|coinciden|términos/i));
  }

  async switchToLogin() {
    await this.tabEntrar.click();
  }

  async switchToRegister() {
    await this.tabCrear.click();
    await this.firstName.waitFor({ state: 'visible' });
  }

  async login(email, password) {
    await this.switchToLogin();
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