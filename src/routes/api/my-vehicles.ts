import { createFileRoute } from "@tanstack/react-router";
import { createVehicle, listMyVehicles } from "@/lib/market";
import {
  apiError,
  corsPreflightResponse,
  jsonWithCors,
  readJson,
} from "@/lib/api/http";

export const Route = createFileRoute("/api/my-vehicles")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        corsPreflightResponse(request.headers.get("origin")),

      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const vehicles = await listMyVehicles();
          return jsonWithCors(vehicles, { status: 200 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        try {
          const body = await readJson<Record<string, unknown>>(request);

          const payload = {
            title: String(body.title ?? ""),
            brand: String(body.brand ?? ""),
            model: String(body.model ?? ""),
            year: Number(body.year),
            mileage: Number(body.mileage),
            price: Number(body.price),
            condition: normalizeCondition(body.condition),
            fuel: normalizeFuel(body.fuel),
            transmission: normalizeTransmission(body.transmission),
            bodyType: normalizeBody(body.bodyType),
            city: String(body.city ?? ""),
            description: String(body.description ?? ""),
            images: Array.isArray(body.images) ? body.images.map(String) : [],
            listingType: normalizeListing(body.listingType),
            taxesCurrent: body.taxesCurrent !== false,
            finesCurrent: body.finesCurrent !== false,
            taxesDetail: body.taxesDetail ? String(body.taxesDetail) : undefined,
            taxesAmount:
              body.taxesAmount != null ? Number(body.taxesAmount) : undefined,
            finesDetail: body.finesDetail ? String(body.finesDetail) : undefined,
            finesAmount:
              body.finesAmount != null ? Number(body.finesAmount) : undefined,
            soatExpires: body.soatExpires ? String(body.soatExpires) : undefined,
            tecnoExpires: body.tecnoExpires
              ? String(body.tecnoExpires)
              : undefined,
            showWhatsapp: body.showWhatsapp !== false,
            acceptLowerOffers: body.acceptLowerOffers !== false,
            minOfferPercent:
              body.minOfferPercent != null
                ? Number(body.minOfferPercent)
                : null,
            swapPrefs: body.swapPrefs as { any?: boolean } | undefined,
          };

          const result = await createVehicle({ data: payload as never });
          return jsonWithCors(result, { status: 201 }, origin);
        } catch (err) {
          return apiError(err, origin);
        }
      },
    },
  },
});

function normalizeCondition(v: unknown): "nuevo" | "seminuevo" | "usado" {
  const s = String(v ?? "usado").toLowerCase();
  if (s === "nuevo") return "nuevo";
  if (s === "seminuevo") return "seminuevo";
  return "usado";
}

function normalizeFuel(
  v: unknown,
): "gasolina" | "diesel" | "hibrido" | "electrico" {
  const s = String(v ?? "gasolina")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (s.includes("diesel")) return "diesel";
  if (s.includes("hibr")) return "hibrido";
  if (s.includes("electr")) return "electrico";
  return "gasolina";
}

function normalizeTransmission(v: unknown): "manual" | "automatica" {
  const s = String(v ?? "manual")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (s.includes("auto")) return "automatica";
  return "manual";
}

function normalizeBody(
  v: unknown,
): "sedan" | "suv" | "pickup" | "hatchback" | "van" | "coupe" {
  const s = String(v ?? "sedan")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (s.includes("suv")) return "suv";
  if (s.includes("pick")) return "pickup";
  if (s.includes("hatch")) return "hatchback";
  if (s.includes("van")) return "van";
  if (s.includes("coup")) return "coupe";
  return "sedan";
}

function normalizeListing(v: unknown): "venta" | "permuta" | "ambos" {
  const s = String(v ?? "venta").toLowerCase();
  if (s === "permuta") return "permuta";
  if (s === "ambos") return "ambos";
  return "venta";
}
