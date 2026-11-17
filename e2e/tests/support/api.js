// e2e/tests/support/api.js
const BASE = 'http://localhost:8080';

/**
 * Crea un usuario de prueba (ajusta según tu endpoint real de Better Auth)
 */
export async function createUser(request, { email, password, name = 'Usuario Test' }) {
  // Ajusta esta ruta según cómo esté implementado el registro en tu API
  const response = await request.post(`${BASE}/api/auth/sign-up/email`, {
    data: {
      email,
      password,
      name,
    },
  });

  return response;
}

/**
 * Inicia sesión y devuelve las cookies / token
 */
export async function loginUser(request, { email, password }) {
  const response = await request.post(`${BASE}/api/auth/sign-in/email`, {
    data: {
      email,
      password,
    },
  });

  return response;
}

/**
 * Crea un anuncio de prueba (ajusta el endpoint real)
 */
export async function createListing(request, data, cookies = null) {
  const headers = cookies ? { Cookie: cookies } : {};

  const response = await request.post(`${BASE}/api/listings`, { // ← ajusta la ruta real
    data,
    headers,
  });

  return response;
}