// e2e/tests/support/api.js
/**
 * Helpers para crear datos por API (mejor que UI cuando se pueda).
 * Por ahora dejamos un placeholder; lo completamos cuando veamos
 * los endpoints reales de Better Auth o de la app.
 */

/**
 * Crea un usuario único (por ahora solo genera los datos).
 * Más adelante se puede hacer un POST real a /api/auth/sign-up/email
 */
export function createUniqueUser(prefix = 'e2e') {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9999);
  return {
    email: `${prefix}.${ts}.${rand}@example.com`,
    password: 'TestPass123!',
    name: `E2E User ${rand}`,
    firstName: 'E2E',
    lastName: `User${rand}`,
    phone: `310${String(ts).slice(-7)}`,
    documentNumber: String(ts).slice(-10),
  };
}