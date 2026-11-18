// e2e/tests/support/auth.js
import { LoginPage } from './pages/LoginPage.js';

export async function loginAs(page, { email, password }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  });
}

export function uniqueUser(prefix = 'e2e') {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return {
    email: `${prefix}.${ts}.${rand}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: `User${rand}`,
    phone: `300${String(ts).slice(-7)}`,
    documentNumber: String(ts).slice(-10),
  };
}