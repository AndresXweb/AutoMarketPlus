import { createFileRoute } from "@tanstack/react-router";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { svcCreateVehicle, svcListMyVehicles } from "@/lib/api/service";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/my-vehicles")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        return corsPreflightResponse(request.headers.get("origin"));
      },

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const vehicles = await svcListMyVehicles(userId);
          return jsonWithCors(vehicles, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const userId = await requireApiUserId(request);
          const body = await readJson<{
            title: string;
            brand: string;
            model: string;
            year: number;
            mileage: number;
            price: number;
            condition: string;
            fuel: string;
            transmission: string;
            bodyType: string;
            city: string;
            description: string;
            images: string[];
            listingType: string;
            soatExpires?: string | null;
            tecnoExpires?: string | null;
            taxesCurrent?: boolean;
            taxesDetail?: string | null;
            taxesAmount?: number;
            finesCurrent?: boolean;
            finesDetail?: string | null;
            finesAmount?: number;
            swapPrefs?: { any?: boolean };
            showWhatsapp?: boolean;
            acceptLowerOffers?: boolean;
            minOfferPercent?: number | null;
          }>(request);

          const result = await svcCreateVehicle(userId, body);
          return jsonWithCors(result, { status: 201 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});
