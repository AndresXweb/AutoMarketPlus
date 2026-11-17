// e2e/tests/support/pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel(/correo|email/i);
    this.passwordInput = page.getByLabel(/contraseña|password/i);
    this.submitButton = page.getByRole('button', { name: /iniciar sesión|entrar|login/i });
    this.errorMessage = page.getByRole('alert').or(page.locator('[data-testid="error"]'));
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}