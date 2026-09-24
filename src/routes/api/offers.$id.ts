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
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      POST: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const id = Number(params.id);
          if (!Number.isFinite(id) || id <= 0) {
            return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
          }

          const body = await readJson<{
            action?: string;
            status?: string;
            message?: string;
            amount?: number;
            swapVehicleId?: number;
          }>(request);

          const action = (body.action ?? body.status ?? "").toLowerCase();

          if (action === "aceptada" || action === "aceptar") {
            await svcRespondOffer(userId, id, "aceptada");
            return jsonWithCors({ ok: true }, { status: 200 }, origin);
          }
          if (action === "rechazada" || action === "rechazar") {
            await svcRespondOffer(userId, id, "rechazada");
            return jsonWithCors({ ok: true }, { status: 200 }, origin);
          }
          if (
            action === "contraoferta" ||
            action === "counter" ||
            body.message
          ) {
            await svcCounterOffer(userId, {
              id,
              amount: body.amount != null ? Number(body.amount) : undefined,
              swapVehicleId:
                body.swapVehicleId != null
                  ? Number(body.swapVehicleId)
                  : undefined,
              message: String(body.message ?? "Contraoferta"),
            });
            return jsonWithCors({ ok: true }, { status: 200 }, origin);
          }

          return jsonWithCors(
            {
              error:
                "action debe ser aceptada | rechazada | contraoferta (o status)",
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
