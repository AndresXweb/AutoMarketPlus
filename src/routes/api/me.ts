import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { svcGetProfile } from "@/lib/api/service";
import { apiError, corsPreflightResponse, jsonWithCors } from "@/lib/api/http";

export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const profile = await svcGetProfile(userId);
          return jsonWithCors({ userId, profile }, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
