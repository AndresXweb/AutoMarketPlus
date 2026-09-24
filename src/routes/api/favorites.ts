import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { svcListFavorites, svcToggleFavorite } from "@/lib/api/service";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/favorites")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const list = await svcListFavorites(userId);
          return jsonWithCors(list, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      /** Toggle favorito: { "vehicleId": 123 } */
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const body = await readJson<{ vehicleId: number }>(request);
          if (!body.vehicleId || !Number.isFinite(Number(body.vehicleId))) {
            return jsonWithCors(
              { error: "vehicleId requerido" },
              { status: 400 },
              origin,
            );
          }
          const result = await svcToggleFavorite(
            userId,
            Number(body.vehicleId),
          );
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
