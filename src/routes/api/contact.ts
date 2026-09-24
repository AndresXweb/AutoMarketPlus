import { createFileRoute } from "@tanstack/react-router";
import { submitContact } from "@/lib/market";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const body = await readJson<{
            name?: string;
            email?: string;
            phone?: string;
            subject?: string;
            message?: string;
          }>(request);

          await submitContact({
            data: {
              name: String(body.name ?? ""),
              email: String(body.email ?? ""),
              phone: String(body.phone ?? ""),
              subject: body.subject ? String(body.subject) : undefined,
              message: String(body.message ?? ""),
            },
          });
          return jsonWithCors({ ok: true }, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
