import { createFileRoute } from "@tanstack/react-router";
import { getVehicle } from "@/lib/market";
import { apiError, corsPreflightResponse, jsonWithCors } from "@/lib/api/http";

export const Route = createFileRoute("/api/vehicles/$id")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        const id = Number(params.id);

        if (!Number.isFinite(id) || id <= 0) {
          return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
        }

        try {
          const vehicle = await getVehicle({ data: { id } });
          if (!vehicle) {
            return jsonWithCors(
              { error: "Vehículo no encontrado" },
              { status: 404 },
              origin,
            );
          }
          return jsonWithCors(vehicle, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
