import { createFileRoute } from "@tanstack/react-router";
import { createOffer, listMyOffers } from "@/lib/market";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/offers")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const data = await listMyOffers();
          return jsonWithCors(data, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const body = await readJson<{
            vehicleId?: number;
            offerType?: string;
            amount?: number;
            swapVehicleId?: number;
            message?: string;
          }>(request);

          const vehicleId = Number(body.vehicleId);
          if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
            return jsonWithCors(
              { error: "vehicleId inválido" },
              { status: 400 },
              origin,
            );
          }

          const offerType =
            body.offerType === "permuta" ? "permuta" : "compra";

          const result = await createOffer({
            data: {
              vehicleId,
              offerType,
              amount: body.amount != null ? Number(body.amount) : undefined,
              swapVehicleId:
                body.swapVehicleId != null
                  ? Number(body.swapVehicleId)
                  : undefined,
              message: body.message,
            },
          });
          return jsonWithCors(result ?? { ok: true }, { status: 201 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
