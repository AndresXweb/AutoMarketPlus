import { createFileRoute } from "@tanstack/react-router";
import { getApiUserId } from "@/lib/auth/api-auth";
import { svcSubmitContact } from "@/lib/api/service";
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

          if (!body.name || !body.email || !body.phone || !body.message) {
            return jsonWithCors(
              { error: "name, email, phone y message son requeridos" },
              { status: 400 },
              origin,
            );
          }

          const userId = await getApiUserId(request);
          const result = await svcSubmitContact({
            name: body.name,
            email: body.email,
            phone: body.phone,
            subject: body.subject,
            message: body.message,
            userId,
          });
          return jsonWithCors(result ?? { ok: true }, { status: 201 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
