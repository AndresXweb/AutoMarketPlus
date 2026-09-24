import { createFileRoute } from "@tanstack/react-router";
import { featuredVehicles } from "@/lib/market";
import { apiError, corsPreflightResponse, jsonWithCors } from "@/lib/api/http";

export const Route = createFileRoute("/api/featured")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const vehicles = await featuredVehicles();
          return jsonWithCors(vehicles, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
