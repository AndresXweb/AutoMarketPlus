/**
 * Headers CORS para las rutas /api/*
 * Flutter nativo normalmente no necesita CORS, pero sí lo necesita
 * si pruebas desde web, emulador o herramientas como Postman/Thunder Client.
 */

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

export function corsHeaders(origin?: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
  };
}

/** Respuesta vacía para el preflight OPTIONS */
export function corsPreflightResponse(origin?: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/** Envuelve un JSON con headers CORS */
export function jsonWithCors(
  data: unknown,
  init: ResponseInit = {},
  origin?: string | null,
): Response {
  const headers = new Headers(init.headers);
  const cors = corsHeaders(origin);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value as string);
  }
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}
