/**
 * Semana 5 — Capa API
 * Spy sobre console.warn + Fake de SQL
 * Verifica que pauseInactiveVehicles no rompe la app cuando falta la columna.
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

// Importar DESPUÉS de los mocks
const { listVehiclesHandler } = await import("./market");

describe("pauseInactiveVehicles – resiliencia ante migración pendiente", () => {
  // Tipo de doble:
  // - Fake: createMockSql (repositorio controlado)
  // - Spy: console.warn

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("listVehicles sigue funcionando aunque pauseInactiveVehicles falle por columna faltante", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const sql = createMockSql(async (text) => {
      // Simula el error de PostgreSQL cuando la migración 0004 no se ha aplicado
      if (text.includes("update vehicles") && text.includes("pausado")) {
        throw new Error('column "last_activity_at" does not exist');
      }

      // El SELECT normal de listVehicles
      if (text.includes("from vehicles v") && text.includes("left join profiles")) {
        return [
          {
            id: 1,
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
            description: "Excelente estado",
            image_url: "https://example.com/1.jpg",
            images: JSON.stringify(["https://example.com/1.jpg"]),
            listing_type: "venta",
            status: "activo",
            created_at: "2026-01-15T10:00:00Z",
            last_activity_at: null,
            paused_reason: null,
            free_reactivations_used: 0,
            show_whatsapp: true,
            accept_lower_offers: true,
            min_offer_percent: null,
            seller_name: "Vendedor Demo",
            seller_verified: true,
            seller_phone: "3001234567",
            seller_whatsapp: "3001234567",
            seller_email: "seller@example.com",
            taxes_current: true,
            taxes_amount: 0,
            fines_current: true,
            fines_amount: 0,
            swap_any: true,
            swap_prefs: null,
          },
        ];
      }

      return [];
    });

    mockGetSql.mockResolvedValue(sql);

    // Act: la app debe seguir respondiendo aunque el pause falle
    const result = await listVehiclesHandler({});

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe("Mazda");

    // El spy debe haberse llamado con el warning de migración
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain("migración 0004 pendiente");
  });

  it("listVehicles funciona normal cuando pauseInactiveVehicles no falla", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const sql = createMockSql(async (text) => {
      if (text.includes("update vehicles") && text.includes("pausado")) {
        return []; // éxito, no hace nada
      }
      if (text.includes("from vehicles v")) {
        return []; // lista vacía
      }
      return [];
    });

    mockGetSql.mockResolvedValue(sql);

    const result = await listVehiclesHandler({});

    expect(result).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled(); // no debió haber warning
  });
});