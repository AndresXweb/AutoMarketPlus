/**
 * Semana 4 — Capa BD
 * Tests de la lógica de datos de market.ts con getSql mockeado.
 * No pasan por createServerFn (evita el Start context).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Sql } from "@/lib/db";

const mockGetSql = vi.fn<() => Promise<Sql>>();

vi.mock("@/lib/db", () => ({
  getSql: () => mockGetSql(),
}));

vi.mock("@/lib/auth/verify.server", () => ({
  getSessionUser: vi.fn(async () => ({
    id: "user-test-1",
    email: "test@example.com",
  })),
}));

type QueryHandler = (text: string, params: unknown[]) => Promise<unknown[]>;

function createMockSql(handler: QueryHandler): Sql {
  const run = async <T>(text: string, params: unknown[] = []): Promise<T[]> =>
    (await handler(text, params)) as T[];

  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}${strings[i + 1]}`;
    }
    return run<T>(text, values);
  }) as unknown as Sql;

  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);

  return sql;
}

function vehicleRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 10,
    user_id: "seller-1",
    title: "Mazda CX-5 2020",
    brand: "Mazda",
    model: "CX-5",
    year: 2020,
    mileage: 45000,
    price: 95_000_000,
    condition: "usado",
    fuel: "gasolina",
    transmission: "automatica",
    body_type: "suv",
    city: "Bogotá",
    description: "Excelente estado, único dueño.",
    image_url: "https://example.com/1.jpg",
    images: JSON.stringify(["https://example.com/1.jpg"]),
    listing_type: "venta",
    status: "activo",
    created_at: "2026-01-15T10:00:00Z",
    last_activity_at: "2026-01-15T10:00:00Z",
    paused_reason: null,
    free_reactivations_used: 0,
    reactivation_requested_at: null,
    show_whatsapp: true,
    accept_lower_offers: true,
    min_offer_percent: null,
    active_offers_count: 0,
    seller_name: "Vendedor Demo",
    seller_verified: true,
    seller_phone: "3001234567",
    seller_whatsapp: "3001234567",
    seller_email: "seller@example.com",
    soat_expires: null,
    tecno_expires: null,
    taxes_current: true,
    taxes_detail: null,
    taxes_amount: 0,
    fines_current: true,
    fines_detail: null,
    fines_amount: 0,
    swap_any: true,
    swap_prefs: null,
    ...overrides,
  };
}

// Importar DESPUÉS de los mocks
const {
  listVehiclesHandler,
  getVehicleHandler,
  createVehicleHandler,
  createOfferHandler,
} = await import("./market");

describe("Capa BD — lógica de datos market (SQL mockeado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listVehicles aplica filtro de ciudad y solo devuelve coincidencias", async () => {
    const sql = createMockSql(async (text, params) => {
      if (text.includes("update vehicles") && text.includes("pausado")) return [];
      if (text.includes("from vehicles v") && text.includes("left join profiles")) {
        expect(text.toLowerCase()).toContain("v.city");
        expect(params).toContain("Bogotá");
        return [vehicleRow({ city: "Bogotá", brand: "Mazda" })];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const result = await listVehiclesHandler({ city: "Bogotá" });

    expect(result).toHaveLength(1);
    expect(result[0].city).toBe("Bogotá");
    expect(result[0].brand).toBe("Mazda");
  });

  it("listVehicles con filtro de marca no devuelve otras marcas", async () => {
    const sql = createMockSql(async (text, params) => {
      if (text.includes("update vehicles") && text.includes("pausado")) return [];
      if (text.includes("from vehicles v")) {
        expect(params).toContain("Toyota");
        return [];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const result = await listVehiclesHandler({ brand: "Toyota" });
    expect(result).toEqual([]);
  });

  it("getVehicle incluye activeOffersCount cuando el dueño consulta su anuncio", async () => {
    const sql = createMockSql(async (text, params) => {
      if (text.includes("update vehicles") && text.includes("pausado")) return [];
      if (text.includes("from vehicles v") && text.includes("where v.id")) {
        return [vehicleRow({ id: 42, user_id: "user-test-1", status: "activo" })];
      }
      if (text.includes("from offers") && text.includes("vehicle_id")) {
        expect(params).toContain(42);
        return [{ c: 3 }];
      }
      if (text.includes("from profiles")) {
        return [{ role: "cliente", account_status: "activo" }];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const result = await getVehicleHandler({ id: 42 });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(42);
    expect(result!.activeOffersCount).toBe(3);
  });

  it("createVehicle deja status 'pendiente_revision' si el perfil no está verificado", async () => {
    const sql = createMockSql(async (text, params) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [
          {
            role: "cliente",
            verification_status: "sin_verificar",
            account_status: "activo",
          },
        ];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("insert into vehicles")) {
        const statusPendiente =
          params.some((p) => p === "pendiente_revision") ||
          text.includes("pendiente_revision");
        expect(statusPendiente).toBe(true);
        return [{ id: 99 }];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const payload = {
      title: "Chevrolet Spark 2019",
      brand: "Chevrolet",
      model: "Spark",
      year: 2019,
      mileage: 60000,
      price: 28_000_000,
      condition: "usado" as const,
      fuel: "gasolina" as const,
      transmission: "manual" as const,
      bodyType: "hatchback" as const,
      city: "Medellín",
      description: "Buen estado general, papeles al día.",
      images: ["https://example.com/spark.jpg"],
      listingType: "venta" as const,
      taxesCurrent: true,
      finesCurrent: true,
    };

    const result = await createVehicleHandler(
      { userId: "user-test-1" },
      payload,
    );

    expect(result).toEqual({ id: 99, status: "pendiente_revision" });
  });

  it("createOffer rechaza oferta sobre el propio anuncio", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [
          {
            role: "cliente",
            account_status: "activo",
            verification_status: "verificado",
          },
        ];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [
          {
            user_id: "user-test-1",
            listing_type: "venta",
            status: "activo",
            price: 50_000_000,
            swap_any: true,
            swap_prefs: null,
            accept_lower_offers: true,
            min_offer_percent: null,
          },
        ];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 7, offerType: "compra", amount: 45_000_000 },
      ),
    ).rejects.toThrow(/propio anuncio/i);
  });

  it("createOffer rechaza oferta sobre anuncio que no está activo", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [
          {
            role: "cliente",
            account_status: "activo",
            verification_status: "verificado",
          },
        ];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [
          {
            user_id: "otro-vendedor",
            listing_type: "venta",
            status: "pausado",
            price: 50_000_000,
            swap_any: true,
            swap_prefs: null,
            accept_lower_offers: true,
            min_offer_percent: null,
          },
        ];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 8, offerType: "compra", amount: 40_000_000 },
      ),
    ).rejects.toThrow(/no está disponible/i);
  });
});