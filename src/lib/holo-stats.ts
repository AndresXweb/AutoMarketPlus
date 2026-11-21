/** Utilidades para armar series y conteos de los paneles holográficos del admin. */

export type DayCounts = { day: string; listings: number; offers: number };

function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Cuenta eventos por día durante los últimos `n` días (hoy incluido).
 * `a` alimenta la primera serie y `b` la segunda; las fechas inválidas se ignoran.
 */
export function bucketByDay(
  a: Array<string | null | undefined>,
  b: Array<string | null | undefined> = [],
  n = 14,
): DayCounts[] {
  const days: DayCounts[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push({ day: dayKey(d), listings: 0, offers: 0 });
  }
  const index = new Map(days.map((d, i) => [d.day, i]));
  const add = (list: Array<string | null | undefined>, key: "listings" | "offers") => {
    for (const raw of list) {
      if (!raw) continue;
      const t = new Date(raw);
      if (Number.isNaN(t.getTime())) continue;
      const i = index.get(dayKey(t));
      if (i != null) days[i][key] += 1;
    }
  };
  add(a, "listings");
  add(b, "offers");
  return days;
}

/** Agrupa y cuenta por la clave que devuelva `keyFn` (ignora claves vacías). */
export function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined) {
  const out = new Map<string, number>();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return [...out.entries()].sort((x, y) => y[1] - x[1]);
}

/** Pesos en formato compacto: $ 1,2 M. */
export function formatCopCompact(value: number) {
  const n = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return `$ ${n}`;
}
