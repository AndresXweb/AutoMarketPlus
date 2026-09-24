import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { svcCounterOffer, svcRespondOffer } from "@/lib/api/service";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/offers/$id")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      /**
       * Responder o contraofertar.
       * Body:
       *   { "action": "aceptada" | "rechazada" }
       *   { "action": "contraoferta", "amount"?: number, "swapVehicleId"?: number, "message": string }
       */
      POST: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        const id = Number(params.id);
        if (!Number.isFinite(id) || id <= 0) {
          return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
        }

        try {
          const userId = await requireApiUserId(request);
          const body = await readJson<{
            action: string;
            amount?: number;
            swapVehicleId?: number;
            message?: string;
          }>(request);

          if (body.action === "aceptada" || body.action === "rechazada") {
            const result = await svcRespondOffer(
              userId,
              id,
              body.action as "aceptada" | "rechazada",
            );
            return jsonWithCors(result, { status: 200 }, origin);
          }

          if (body.action === "contraoferta") {
            if (!body.message || body.message.length < 2) {
              return jsonWithCors(
                { error: "message requerido (mín. 2 caracteres)" },
                { status: 400 },
                origin,
              );
            }
            const result = await svcCounterOffer(userId, {
              id,
              amount: body.amount != null ? Number(body.amount) : undefined,
              swapVehicleId:
                body.swapVehicleId != null
                  ? Number(body.swapVehicleId)
                  : undefined,
              message: body.message,
            });
            return jsonWithCors(result, { status: 200 }, origin);
          }

          return jsonWithCors(
            {
              error:
                'action debe ser "aceptada", "rechazada" o "contraoferta"',
            },
            { status: 400 },
            origin,
          );
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
