/**
 * Semana 5 — Capa BD
 * Dobles sobre getSql: verificar qué se guarda y qué NO se guarda.
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

const { createOfferHandler } = await import("./market");

describe("Capa BD — dobles: createOffer y persistencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stub de email no verificado: lanza error y NO inserta en offers", async () => {
    // Tipo de doble: STUB (getSql devuelve respuestas fijas) + verificación de comportamiento
    const insertOffers = vi.fn();

    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [{ role: "cliente", account_status: "activo" }];
      }
      if (text.includes("emailVerified") || text.includes('"user"')) {
        return [{ verified: false }]; // stub: correo sin confirmar
      }
      if (text.includes("insert into offers")) {
        insertOffers();
        return [{ id: 1 }];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "buyer-1" },
        { vehicleId: 10, offerType: "compra", amount: 30_000_000 },
      ),
    ).rejects.toThrow(/confirma tu correo/i);

    // Comportamiento: no debe haber persistido
    expect(insertOffers).not.toHaveBeenCalled();
  });

  it("datos inválidos (monto > precio): NO hace insert into offers", async () => {
    // Tipo de doble: STUB del repositorio + assert de no interacción
    const insertOffers = vi.fn();

    const sql = createMockSql(async (text) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [{ role: "cliente", account_status: "activo" }];
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
            price: 40_000_000,
            swap_any: true,
            swap_prefs: null,
            accept_lower_offers: true,
            min_offer_percent: null,
          },
        ];
      }
      if (text.includes("insert into offers")) {
        insertOffers(text);
        return [{ id: 99 }];
      }
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    await expect(
      createOfferHandler(
        { userId: "buyer-1" },
        { vehicleId: 10, offerType: "compra", amount: 50_000_000 },
      ),
    ).rejects.toThrow(/mayor al precio/i);

    expect(insertOffers).not.toHaveBeenCalled();
  });

  it("caso válido: inserta oferta con buyer_id y amount correctos (estado)", async () => {
    // Tipo de doble: FAKE/MOCK del SQL — controla respuesta y registra params
    let offerInsertParams: unknown[] = [];

    const sql = createMockSql(async (text, params) => {
      if (text.includes("from profiles") || text.includes("account_status")) {
        return [{ role: "cliente", account_status: "activo" }];
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
          },
        ];
      }
      if (text.includes("insert into offers")) {
        offerInsertParams = params;
        return [{ id: 777 }];
      }
      if (text.includes("insert into offer_events")) return [];
      if (text.includes("update vehicles")) return [];
      return [];
    });
    mockGetSql.mockResolvedValue(sql);

    const result = await createOfferHandler(
      { userId: "buyer-1" },
      { vehicleId: 10, offerType: "compra", amount: 45_000_000 },
    );

    // Estado
    expect(result).toEqual({ id: 777 });
    // Comportamiento: se persistió con los datos correctos
    expect(offerInsertParams).toContain("buyer-1");
    expect(offerInsertParams).toContain(45_000_000);
    expect(offerInsertParams).toContain(10); // vehicleId
  });
});