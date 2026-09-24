import { createFileRoute } from "@tanstack/react-router";
import { deleteMyVehicle, updateVehicleStatus } from "@/lib/market";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/my-vehicles/$id")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      PATCH: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id) || id <= 0) {
            return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
          }
          const body = await readJson<{ status?: string }>(request);
          const status = body.status as "activo" | "pausado" | "vendido";
          if (!["activo", "pausado", "vendido"].includes(status)) {
            return jsonWithCors(
              { error: "status debe ser activo | pausado | vendido" },
              { status: 400 },
              origin,
            );
          }
          const result = await updateVehicleStatus({ data: { id, status } });
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      DELETE: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id) || id <= 0) {
            return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
          }
          await deleteMyVehicle({ data: { id } });
          return jsonWithCors({ ok: true }, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
