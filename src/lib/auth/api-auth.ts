import { UnauthorizedError } from "./verify.server";

/**
 * Autenticación para las rutas /api/* (Flutter y otros clientes externos).
 *
 * - Lee el header Authorization: Bearer <token>
 * - Usa Better Auth (plugin bearer ya activo)
 * - NO aplica assertSameSiteRequest (solo para server functions web)
 */
export async function getApiUserId(request: Request): Promise<string | null> {
  try {
    const { auth, authConfigured } = await import("./server");
    if (!authConfigured) return null;

    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Igual que getApiUserId, pero lanza 401 si no hay sesión. */
export async function requireApiUserId(request: Request): Promise<string> {
  const userId = await getApiUserId(request);
  if (!userId) throw new UnauthorizedError();
  return userId;
}
