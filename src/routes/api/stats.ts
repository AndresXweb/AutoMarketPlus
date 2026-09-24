import { createFileRoute } from "@tanstack/react-router";
import { marketStats } from "@/lib/market";
import { apiError, corsPreflightResponse, jsonWithCors } from "@/lib/api/http";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const stats = await marketStats();
          return jsonWithCors(stats, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
