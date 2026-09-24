import { getSessionUser, UnauthorizedError } from "./verify.server";

/**
 * Autenticación para las rutas /api/* (Flutter y otros clientes externos).
 *
 * - Lee el header Authorization: Bearer <token>
 * - Usa el mismo Better Auth (plugin bearer ya está activo)
 * - NO aplica assertSameSiteRequest (eso es solo para server functions de la web)
 */

/** Devuelve el userId si hay sesión válida, o null si no hay. */
export async function getApiUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  const bearerToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;

  // getSessionUser ya soporta bearer token (lo usa el live preview)
  const user = await getSessionUser(bearerToken);
  return user?.id ?? null;
}

/** Igual que getApiUserId, pero lanza 401 si no hay sesión. */
export async function requireApiUserId(request: Request): Promise<string> {
  const userId = await getApiUserId(request);
  if (!userId) throw new UnauthorizedError();
  return userId;
}