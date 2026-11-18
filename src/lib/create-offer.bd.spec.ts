/**
 * Semana 4 — Capa BD
 * Tests de createOfferHandler con SQL mockeado.
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

function activeSellerProfile() {
  return [
    {
      role: "cliente",
      account_status: "activo",
      verification_status: "verificado",
    },
  ];
}

function vehicleForOffer(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "vendedor-otro",
    listing_type: "venta",
    status: "activo",
    price: 50_000_000,
    swap_any: true,
    swap_prefs: null,
    accept_lower_offers: true,
    min_offer_percent: null,
    ...overrides,
  };
}

const { createOfferHandler } = await import("./market");

describe("Capa BD — createOfferHandler (SQL mockeado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza oferta de compra mayor al precio publicado", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return activeSellerProfile();
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [vehicleForOffer({ price: 50_000_000 })];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 10, offerType: "compra", amount: 60_000_000 },
      ),
    ).rejects.toThrow(/mayor al precio/i);
  });

  it("rechaza oferta de compra sobre un anuncio que solo acepta permuta", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return activeSellerProfile();
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [vehicleForOffer({ listing_type: "permuta" })];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 11, offerType: "compra", amount: 40_000_000 },
      ),
    ).rejects.toThrow(/solo acepta permuta/i);
  });

  it("rechaza oferta por debajo del porcentaje mínimo permitido", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return activeSellerProfile();
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [
          vehicleForOffer({
            price: 100_000_000,
            accept_lower_offers: true,
            min_offer_percent: 80,
          }),
        ];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "user-test-1" },
        { vehicleId: 12, offerType: "compra", amount: 70_000_000 },
      ),
    ).rejects.toThrow(/oferta mínima/i);
  });

  it("crea la oferta de compra cuando el monto es válido", async () => {
    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return activeSellerProfile();
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: true }];
      }
      if (text.includes("from vehicles") && text.includes("where id")) {
        return [vehicleForOffer({ price: 50_000_000 })];
      }
      if (text.includes("insert into offers")) {
        return [{ id: 501 }];
      }
      if (text.includes("insert into offer_events")) {
        return [];
      }
      if (text.includes("update vehicles") && text.includes("last_activity_at")) {
        return [];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const result = await createOfferHandler(
      { userId: "user-test-1" },
      { vehicleId: 13, offerType: "compra", amount: 45_000_000 },
    );

    expect(result).toEqual({ id: 501 });
  });
});
