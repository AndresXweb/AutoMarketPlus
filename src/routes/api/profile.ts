import { createFileRoute } from "@tanstack/react-router";
import {
  getMyProfile,
  updateMyProfile,
  submitVerification,
} from "@/lib/market";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const profile = await getMyProfile();
          if (!profile) {
            return jsonWithCors(
              { error: "Perfil no encontrado" },
              { status: 404 },
              origin,
            );
          }
          return jsonWithCors(profile, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      PATCH: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const body = await readJson(request);
          await updateMyProfile({ data: body as never });
          return jsonWithCors({ ok: true }, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const body = await readJson<Record<string, unknown>>(request);
          if (body.idFrontUrl && body.idBackUrl) {
            await submitVerification({
              data: {
                idFrontUrl: String(body.idFrontUrl),
                idBackUrl: String(body.idBackUrl),
                documentType:
                  (body.documentType as "CC" | "CE" | "NIT" | "PA") ?? "CC",
                documentNumber: String(body.documentNumber ?? ""),
              },
            });
            return jsonWithCors({ ok: true }, { status: 200 }, origin);
          }
          await updateMyProfile({ data: body as never });
          return jsonWithCors({ ok: true }, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
