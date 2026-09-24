import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import {
  svcDeleteMyVehicle,
  svcUpdateVehicleStatus,
} from "@/lib/api/service";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/my-vehicles/$id")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      /** Cambiar estado: { "status": "activo" | "pausado" | "vendido" } */
      PATCH: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        const id = Number(params.id);
        if (!Number.isFinite(id) || id <= 0) {
          return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
        }

        try {
          const userId = await requireApiUserId(request);
          const body = await readJson<{ status: string }>(request);
          const status = body.status as "activo" | "pausado" | "vendido";
          if (!["activo", "pausado", "vendido"].includes(status)) {
            return jsonWithCors(
              { error: "status debe ser activo, pausado o vendido" },
              { status: 400 },
              origin,
            );
          }
          const result = await svcUpdateVehicleStatus(userId, id, status);
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      DELETE: async ({ request, params }) => {
        const origin = request.headers.get("origin");
        const id = Number(params.id);
        if (!Number.isFinite(id) || id <= 0) {
          return jsonWithCors({ error: "ID inválido" }, { status: 400 }, origin);
        }

        try {
          const userId = await requireApiUserId(request);
          const result = await svcDeleteMyVehicle(userId, id);
          return jsonWithCors(result, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
