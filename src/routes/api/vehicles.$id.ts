// src/routes/api/vehicles.$id.ts
import { createFileRoute } from "@tanstack/react-router";
import { getVehicle } from "@/lib/market";
import { corsPreflightResponse, jsonWithCors } from "@/lib/api/cors";

export const Route = createFileRoute("/api/vehicles/$id")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        return corsPreflightResponse(origin);
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
            return jsonWithCors({ error: "Vehículo no encontrado" }, { status: 404 }, origin);
          }
          return jsonWithCors(vehicle, { status: 200 }, origin);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error interno";
          return jsonWithCors({ error: message }, { status: 500 }, origin);
        }
      },
    },
  },
});