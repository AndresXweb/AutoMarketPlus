import { describe, it, expect } from "vitest";
import {
  canFreeReactivate,
  shouldPauseForInactivity,
  FREE_REACTIVATIONS,
  LISTING_ACTIVE_DAYS,
} from "./market";

describe("canFreeReactivate", () => {
  // Tipo de doble: ninguno (función pura).

  it("permite reactivación gratis cuando está pausado por inactividad y aún no usó el cupo", () => {
    const result = canFreeReactivate({
      pausedReason: "inactividad",
      freeReactivationsUsed: 0,
    });

    expect(result).toEqual({ canFree: true, reason: "free" });
  });

  it("obliga a solicitar cuando ya usó la reactivación gratis", () => {
    const result = canFreeReactivate({
      pausedReason: "inactividad",
      freeReactivationsUsed: FREE_REACTIVATIONS,
    });

    expect(result).toEqual({ canFree: false, reason: "request" });
  });

  it("no permite reactivación gratis si la pausa no es por inactividad", () => {
    const result = canFreeReactivate({
      pausedReason: "manual",
      freeReactivationsUsed: 0,
    });

    expect(result).toEqual({ canFree: false, reason: "not_inactivity" });
  });

  it("trata pausedReason null o undefined como no-inactividad", () => {
    expect(
      canFreeReactivate({ pausedReason: null, freeReactivationsUsed: 0 }),
    ).toEqual({ canFree: false, reason: "not_inactivity" });

    expect(
      canFreeReactivate({ pausedReason: undefined, freeReactivationsUsed: 0 }),
    ).toEqual({ canFree: false, reason: "not_inactivity" });
  });

  it("con freeReactivationsUsed mayor al límite también pide solicitud", () => {
    const result = canFreeReactivate({
      pausedReason: "inactividad",
      freeReactivationsUsed: FREE_REACTIVATIONS + 2,
    });

    expect(result).toEqual({ canFree: false, reason: "request" });
  });
});

describe("shouldPauseForInactivity", () => {
  // Tipo de doble: Stub de reloj (inyectamos `now` fijo).

  const FIXED_NOW = new Date("2026-11-05T12:00:00.000Z");

  it("NO pausa si aún no han pasado los 30 días", () => {
    const lastActivity = new Date(FIXED_NOW);
    lastActivity.setUTCDate(lastActivity.getUTCDate() - (LISTING_ACTIVE_DAYS - 1));

    const result = shouldPauseForInactivity({
      lastActivityAt: lastActivity.toISOString(),
      now: FIXED_NOW,
    });

    expect(result).toBe(false);
  });

  it("SÍ pausa cuando han pasado exactamente 30 días o más", () => {
    const lastActivity = new Date(FIXED_NOW);
    lastActivity.setUTCDate(lastActivity.getUTCDate() - LISTING_ACTIVE_DAYS);

    expect(
      shouldPauseForInactivity({
        lastActivityAt: lastActivity.toISOString(),
        now: FIXED_NOW,
      }),
    ).toBe(true);

    const older = new Date(FIXED_NOW);
    older.setUTCDate(older.getUTCDate() - (LISTING_ACTIVE_DAYS + 1));

    expect(
      shouldPauseForInactivity({
        lastActivityAt: older.toISOString(),
        now: FIXED_NOW,
      }),
    ).toBe(true);
  });

  it("no pausa si lastActivityAt es null o undefined", () => {
    expect(
      shouldPauseForInactivity({ lastActivityAt: null, now: FIXED_NOW }),
    ).toBe(false);

    expect(
      shouldPauseForInactivity({ lastActivityAt: undefined, now: FIXED_NOW }),
    ).toBe(false);
  });

  it("no pausa si la fecha es inválida", () => {
    expect(
      shouldPauseForInactivity({
        lastActivityAt: "fecha-invalida",
        now: FIXED_NOW,
      }),
    ).toBe(false);
  });
});