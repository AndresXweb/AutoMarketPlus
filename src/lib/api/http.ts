import { UnauthorizedError } from "@/lib/auth/verify.server";
import { corsPreflightResponse, jsonWithCors } from "@/lib/api/cors";

export { corsPreflightResponse, jsonWithCors };

export function apiError(err: unknown, origin?: string | null): Response {
  if (err instanceof UnauthorizedError) {
    return jsonWithCors({ error: "Unauthorized" }, { status: 401 }, origin);
  }
  const message = err instanceof Error ? err.message : "Error interno";
  let status = 400;
  if (message === "Forbidden") status = 403;
  else if (
    /no encontrado|no está disponible|Perfil no encontrado/i.test(message)
  ) {
    status = 404;
  }
  return jsonWithCors({ error: message }, { status }, origin);
}

export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Body JSON inválido");
  }
}
