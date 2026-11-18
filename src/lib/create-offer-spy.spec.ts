/**
 * Semana 5 — Capa API (dobles de prueba)
 * Fake de SQL + Spy sobre consultas
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const { createOfferHandler } = await import("./market");

describe("Semana 5 — createOfferHandler con Fake SQL + Spy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("NO inserta la oferta cuando el monto supera el precio", async () => {
    const queries: string[] = [];

    const sql = createMockSql(async (text) => {
      queries.push(text.toLowerCase());
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [{ role: "cliente", account_status: "activo", verification_status: "verificado" }];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [{
          user_id: "vendedor-otro",
          listing_type: "venta",
          status: "activo",
          price: 50_000_000,
          swap_any: true,
          swap_prefs: null,
          accept_lower_offers: true,
          min_offer_percent: null,
        }];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 20, offerType: "compra", amount: 99_000_000 },
      ),
    ).rejects.toThrow(/mayor al precio/i);

    expect(queries.some((q) => q.includes("insert into offers"))).toBe(false);
  });

  it("SÍ inserta oferta + evento cuando el monto es válido", async () => {
    const queries: string[] = [];

    const sql = createMockSql(async (text) => {
      queries.push(text.toLowerCase());
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [{ role: "cliente", account_status: "activo", verification_status: "verificado" }];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [{
          user_id: "vendedor-otro",
          listing_type: "venta",
          status: "activo",
          price: 50_000_000,
          swap_any: true,
          swap_prefs: null,
          accept_lower_offers: true,
          min_offer_percent: null,
        }];
      }
      if (text.includes("insert into offers")) return [{ id: 777 }];
      if (text.includes("insert into offer_events")) return [];
      if (text.includes("update vehicles") && text.includes("last_activity_at")) return [];
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const result = await createOfferHandler(
      { userId: "user-test-1" },
      { vehicleId: 21, offerType: "compra", amount: 40_000_000 },
    );

    expect(result).toEqual({ id: 777 });
    expect(queries.some((q) => q.includes("insert into offers"))).toBe(true);
    expect(queries.some((q) => q.includes("insert into offer_events"))).toBe(true);
    expect(queries.some((q) => q.includes("last_activity_at"))).toBe(true);
  });

  it("rechaza permuta sin swapVehicleId", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [{ role: "cliente", account_status: "activo", verification_status: "verificado" }];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [{
          user_id: "vendedor-otro",
          listing_type: "permuta",
          status: "activo",
          price: 0,
          swap_any: true,
          swap_prefs: null,
          accept_lower_offers: true,
          min_offer_percent: null,
        }];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 22, offerType: "permuta" },
      ),
    ).rejects.toThrow(/vehículo para permutar/i);
  });
});
