import { createFileRoute } from "@tanstack/react-router";
import { listFavorites, toggleFavorite } from "@/lib/market";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/favorites")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const list = await listFavorites();
          return jsonWithCors(list, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const body = await readJson<{ vehicleId?: number }>(request);
          const vehicleId = Number(body.vehicleId);
          if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
            return jsonWithCors(
              { error: "vehicleId inválido" },
              { status: 400 },
              origin,
            );
          }
          const result = await toggleFavorite({ data: { vehicleId } });
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
