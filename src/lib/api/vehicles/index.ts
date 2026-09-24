import { createFileRoute } from "@tanstack/react-router";
import { listVehicles } from "@/lib/market";
import { corsPreflightResponse, jsonWithCors } from "@/lib/api/cors";

export const Route = createFileRoute("/api/vehicles/")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        return corsPreflightResponse(origin);
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        const url = new URL(request.url);

        const num = (key: string) => {
          const v = url.searchParams.get(key);
          if (v == null || v === "") return undefined;
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        };

        const filters = {
          q: url.searchParams.get("q") ?? undefined,
          brand: url.searchParams.get("brand") ?? undefined,
          listingType: url.searchParams.get("listingType") ?? undefined,
          bodyType: url.searchParams.get("bodyType") ?? undefined,
          city: url.searchParams.get("city") ?? undefined,
          fuel: url.searchParams.get("fuel") ?? undefined,
          minPrice: num("minPrice"),
          maxPrice: num("maxPrice"),
          yearMin: num("yearMin"),
          yearMax: num("yearMax"),
          verifiedOnly: url.searchParams.get("verifiedOnly") === "true",
        };

        try {
          // Reutilizamos la función que ya existe en market.ts
          const vehicles = await listVehicles({ data: filters });
          return jsonWithCors(vehicles, { status: 200 }, origin);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error interno";
          return jsonWithCors({ error: message }, { status: 500 }, origin);
        }
      },
    },
  },
});