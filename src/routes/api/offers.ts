import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { svcCreateOffer, svcListMyOffers } from "@/lib/api/service";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/offers")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const offers = await svcListMyOffers(userId);
          return jsonWithCors(offers, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const body = await readJson<{
            vehicleId: number;
            offerType: "compra" | "permuta";
            amount?: number;
            swapVehicleId?: number;
            message?: string;
          }>(request);

          if (!body.vehicleId || !body.offerType) {
            return jsonWithCors(
              { error: "vehicleId y offerType requeridos" },
              { status: 400 },
              origin,
            );
          }

          const result = await svcCreateOffer(userId, {
            vehicleId: Number(body.vehicleId),
            offerType: body.offerType,
            amount: body.amount != null ? Number(body.amount) : undefined,
            swapVehicleId:
              body.swapVehicleId != null
                ? Number(body.swapVehicleId)
                : undefined,
            message: body.message,
          });
          return jsonWithCors(result, { status: 201 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
