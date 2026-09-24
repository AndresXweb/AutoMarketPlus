import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import {
  svcGetProfile,
  svcSubmitVerification,
  svcUpdateProfile,
} from "@/lib/api/service";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const profile = await svcGetProfile(userId);
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
          const userId = await requireApiUserId(request);
          const body = await readJson<{
            firstName: string;
            lastName: string;
            phone: string;
            whatsapp?: string;
            city: string;
            address?: string;
            email?: string;
            documentType?: string;
            documentNumber?: string;
          }>(request);

          if (!body.firstName || !body.lastName || !body.phone || !body.city) {
            return jsonWithCors(
              { error: "Faltan campos: firstName, lastName, phone, city" },
              { status: 400 },
              origin,
            );
          }

          const result = await svcUpdateProfile(userId, body);
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      /** Subir cédula (verificación) */
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const body = await readJson<{
            idFrontUrl: string;
            idBackUrl: string;
            documentType: string;
            documentNumber: string;
          }>(request);

          if (
            !body.idFrontUrl ||
            !body.idBackUrl ||
            !body.documentType ||
            !body.documentNumber
          ) {
            return jsonWithCors(
              {
                error:
                  "Faltan: idFrontUrl, idBackUrl, documentType, documentNumber",
              },
              { status: 400 },
              origin,
            );
          }

          const result = await svcSubmitVerification(userId, body);
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
