/**
 * Semana 4 — Capa API
 * Contrato de createOfferHandler: validaciones de oferta (sin rehacer tests de BD).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Sql } from "@/lib/db";

const mockGetSql = vi.fn<() => Promise<Sql>>();

vi.mock("@/lib/db", () => ({
  getSql: () => mockGetSql(),
}));

vi.mock("@/lib/auth/verify.server", () => ({
  getSessionUser: vi.fn(async () => ({
    id: "buyer-1",
    email: "buyer@example.com",
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

/** Usuario activo + email verificado + vehículo de otro en venta */
function happyVehicleSql(
  vehicleOverrides: Record<string, unknown> = {},
  extra?: QueryHandler,
): QueryHandler {
  return async (text, params) => {
    if (text.includes("from profiles") || text.includes("account_status")) {
      return [{ role: "cliente", account_status: "activo", verification_status: "verificado" }];
    }
    if (text.includes("emailVerified") || text.includes('"user"')) {
      return [{ verified: true }];
    }
    if (text.includes("from vehicles") && text.includes("where id")) {
      return [
        {
          user_id: "seller-other",
          listing_type: "venta",
          status: "activo",
          price: 50_000_000,
          swap_any: true,
          swap_prefs: null,
          accept_lower_offers: true,
          min_offer_percent: null,
          ...vehicleOverrides,
        },
      ];
    }
    if (extra) return extra(text, params);
    if (text.includes("insert into offers")) return [{ id: 501 }];
    if (text.includes("insert into offer_events")) return [];
    if (text.includes("update vehicles")) return [];
    return [];
  };
}

const { createOfferHandler } = await import("./market");

describe("Capa API — createOffer (contrato de validación)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza oferta de compra sin monto o con monto <= 0", async () => {
    mockGetSql.mockResolvedValue(createMockSql(happyVehicleSql()));

    await expect(
      createOfferHandler(
        { userId: "buyer-1" },
        { vehicleId: 10, offerType: "compra" },
      ),
    ).rejects.toThrow(/monto válido/i);

    await expect(
      createOfferHandler(
        { userId: "buyer-1" },
        { vehicleId: 10, offerType: "compra", amount: 0 },
      ),
    ).rejects.toThrow(/monto válido/i);
  });

  it("rechaza oferta mayor al precio publicado", async () => {
    mockGetSql.mockResolvedValue(createMockSql(happyVehicleSql({ price: 40_000_000 })));

    await expect(
      createOfferHandler(
        { userId: "buyer-1" },
        { vehicleId: 10, offerType: "compra", amount: 45_000_000 },
      ),
    ).rejects.toThrow(/no puede ser mayor al precio/i);
  });

  it("rechaza compra sobre anuncio solo de permuta", async () => {
    mockGetSql.mockResolvedValue(
      createMockSql(happyVehicleSql({ listing_type: "permuta" })),
    );

    await expect(
      createOfferHandler(
        { userId: "buyer-1" },
        { vehicleId: 10, offerType: "compra", amount: 30_000_000 },
      ),
    ).rejects.toThrow(/solo acepta permuta/i);
  });

  it("caso feliz: crea oferta válida y devuelve id", async () => {
    mockGetSql.mockResolvedValue(createMockSql(happyVehicleSql()));

    const result = await createOfferHandler(
      { userId: "buyer-1" },
      { vehicleId: 10, offerType: "compra", amount: 45_000_000 },
    );

    expect(result).toEqual({ id: 501 });
  });
});