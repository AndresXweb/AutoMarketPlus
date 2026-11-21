import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const HOLO_COLORS = ["#3dd6c6", "#38bdf8", "#3dba86", "#f0b429", "#a78bfa"];
const ACCENT = "#3dd6c6";
const SKY = "#38bdf8";

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Anima un número desde su valor anterior hasta `target`. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    const origin = from.current;
    let start: number | null = null;
    let raf = 0;
    const tick = (now: number) => {
      if (start == null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return Math.round(value);
}

/** false en el primer render, true justo después: dispara las animaciones de entrada. */
function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(id);
  }, []);
  return ready;
}

export function HoloPanel({
  title,
  subtitle,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("holo-panel holo-corners p-5", className)}>
      {title && (
        <header className="mb-4">
          <h2 className="holo-title font-display text-lg font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Contenedor estándar de las pantallas del admin: rejilla de fondo, título y subtítulo. */
export function HoloPage({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="holo-grid-bg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="holo-title font-display text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function LiveBadge({ updatedAt }: { updatedAt: Date | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs text-success">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      En vivo{updatedAt ? ` · ${updatedAt.toLocaleTimeString("es-CO")}` : ""}
    </span>
  );
}

/** Tarjeta con número animado y efecto de inclinación 3D al pasar el mouse. */
export function HoloStat({
  label,
  value,
  alert = false,
  hint,
  format,
}: {
  label: string;
  value: number;
  alert?: boolean;
  hint?: string;
  format?: (n: number) => string;
}) {
  const shown = useCountUp(value);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const resting = tilt.x === 0 && tilt.y === 0;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -9, y: px * 11 });
  }

  return (
    <div style={{ perspective: 900 }}>
      <div
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: resting ? "transform 0.5s ease" : "transform 0.08s linear",
        }}
        className={cn("holo-panel holo-corners p-5", alert && "holo-alert")}
      >
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.18em]",
            alert ? "text-warn" : "text-accent/80",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "holo-glow-text mt-2 font-display text-4xl font-semibold tabular-nums",
            alert ? "text-warn" : "text-fg",
          )}
        >
          {format ? format(shown) : shown}
        </p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export type Slice = { name: string; value: number };

/** Dona holográfica: se dibuja al cargar, anillos giratorios y detalle al pasar el mouse. */
export function HoloDonut({ data }: { data: Slice[] }) {
  const ready = useReady();
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  const totalShown = useCountUp(total);
  const R = 70;
  const C = 2 * Math.PI * R;
  const GAP = data.length > 1 ? 5 : 0;

  let acc = 0;
  const segs = data.map((d, i) => {
    const frac = total ? d.value / total : 0;
    const seg = { i, len: Math.max(0, frac * C - GAP), start: acc, frac };
    acc += frac * C;
    return seg;
  });

  if (total === 0) return <p className="text-sm text-muted">Sin datos todavía.</p>;
  const cur = active != null ? data[active] : null;

  return (
    <div className="grid items-center gap-4 sm:grid-cols-2">
      <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[230px]" role="img" aria-label="Distribución por operación">
        <g className="holo-ring-a">
          <circle cx="110" cy="110" r="100" fill="none" stroke={ACCENT} strokeOpacity="0.35" strokeDasharray="2 9" />
          <circle cx="110" cy="110" r="100" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeDasharray="40 590" strokeLinecap="round" />
        </g>
        <g className="holo-ring-b">
          <circle cx="110" cy="110" r="48" fill="none" stroke={SKY} strokeOpacity="0.45" strokeDasharray="4 7" />
        </g>
        <g transform="rotate(-90 110 110)">
          {segs.map((s) => {
            const color = HOLO_COLORS[s.i % HOLO_COLORS.length];
            const isActive = active === s.i;
            return (
              <circle
                key={s.i}
                cx="110"
                cy="110"
                r={R}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? 26 : 18}
                strokeDasharray={`${ready ? s.len : 0} ${C}`}
                strokeDashoffset={-s.start}
                opacity={active != null && !isActive ? 0.4 : 1}
                style={{
                  transition: `stroke-dasharray 1.1s cubic-bezier(0.2,0.8,0.2,1) ${s.i * 160}ms, stroke-width 0.2s, opacity 0.2s`,
                  filter: `drop-shadow(0 0 7px ${color})`,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setActive(s.i)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </g>
        <text x="110" y={cur ? 102 : 108} textAnchor="middle" fill="#a8b8d0" fontSize="10" letterSpacing="2">
          {cur ? cur.name.toUpperCase() : "TOTAL"}
        </text>
        <text x="110" y={cur ? 128 : 134} textAnchor="middle" fill="#f5f8ff" fontSize="30" fontWeight="600" style={{ filter: "drop-shadow(0 0 8px #3dd6c6)" }}>
          {cur ? cur.value : totalShown}
        </text>
        {cur && (
          <text x="110" y="146" textAnchor="middle" fill={ACCENT} fontSize="11">
            {Math.round((cur.value / total) * 100)}%
          </text>
        )}
      </svg>
      <ul className="grid gap-2">
        {data.map((d, i) => (
          <li
            key={d.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
              active === i ? "border-accent/60 bg-accent/10" : "border-transparent",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: HOLO_COLORS[i % HOLO_COLORS.length], boxShadow: `0 0 8px ${HOLO_COLORS[i % HOLO_COLORS.length]}` }} />
              {d.name}
            </span>
            <span className="tabular-nums text-muted">
              {d.value} · {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontales brillantes con crecimiento animado y destello. */
export function HoloBars({ data }: { data: { name: string; n: number }[] }) {
  const ready = useReady();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((a, d) => a + d.n, 0);
  if (data.length === 0) return <p className="text-sm text-muted">Sin anuncios activos.</p>;

  return (
    <ul className="grid gap-3.5">
      {data.map((d, i) => (
        <li key={d.name} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className={cn("font-medium", active === i ? "text-accent" : "text-fg")}>{d.name}</span>
            <span className="tabular-nums text-muted">
              {d.n} · {total ? Math.round((d.n / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-bg/70 ring-1 ring-accent/15">
            <div
              className="holo-bar-fill h-full rounded-full"
              style={{
                width: ready ? `${(d.n / max) * 100}%` : "0%",
                transition: `width 1s cubic-bezier(0.2,0.8,0.2,1) ${i * 90}ms, box-shadow 0.2s`,
                background: `linear-gradient(90deg, rgba(61,214,198,0.3), ${ACCENT})`,
                boxShadow: active === i ? `0 0 20px ${ACCENT}` : "0 0 10px rgba(61,214,198,0.5)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export type DayPoint = { day: string; listings: number; offers: number };

export type ActivitySeries = { key: "listings" | "offers"; legend: string; tip: string };

const DEFAULT_SERIES: ActivitySeries[] = [
  { key: "listings", legend: "Anuncios publicados", tip: "Anuncios" },
  { key: "offers", legend: "Ofertas creadas", tip: "Ofertas" },
];

function smoothPath(pts: Array<[number, number]>) {
  if (pts.length === 0) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1][0] + pts[i][0]) / 2;
    d += ` C ${cx} ${pts[i - 1][1]}, ${cx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  return d;
}

/** Línea de actividad (14 días) con trazo animado, escáner en movimiento y tooltip por día. */
export function HoloActivity({
  data,
  series: seriesDef = DEFAULT_SERIES,
  ariaLabel = "Actividad de los últimos 14 días",
}: {
  data: DayPoint[];
  series?: ActivitySeries[];
  ariaLabel?: string;
}) {
  const ready = useReady();
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 230;
  const PX = 34;
  const PT = 16;
  const PB = 28;
  const n = data.length;
  const rawMax = Math.max(1, ...data.flatMap((d) => seriesDef.map((def) => d[def.key])));
  const maxV = Math.max(3, Math.ceil(rawMax / 3) * 3);
  const step = n > 1 ? (W - PX - 12) / (n - 1) : 0;
  const x = (i: number) => PX + i * step;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / maxV);
  const base = y(0);

  const series = seriesDef.map((def, idx) => {
    const color = idx === 0 ? ACCENT : SKY;
    const pts = data.map((d, i) => [x(i), y(d[def.key])] as [number, number]);
    const line = smoothPath(pts);
    const area = pts.length ? `${line} L ${pts[pts.length - 1][0]} ${base} L ${pts[0][0]} ${base} Z` : "";
    return { ...def, id: String(idx), color, pts, line, area, total: data.reduce((a, d) => a + d[def.key], 0) };
  });

  if (n === 0) return <p className="text-sm text-muted">Sin datos de actividad.</p>;

  const fmt = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
  const tipX = hover != null ? Math.min(Math.max(x(hover) - 75, 4), W - 154) : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {series.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
            {s.legend}: <strong className="tabular-nums text-fg">{s.total}</strong>
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.id} id={`holo-area-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <linearGradient id="holo-sweep-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((k) => {
          const v = (maxV / 3) * k;
          return (
            <g key={k}>
              <line x1={PX} x2={W - 12} y1={y(v)} y2={y(v)} stroke={ACCENT} strokeOpacity="0.14" strokeDasharray="3 5" />
              <text x={PX - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#6d809c">
                {v}
              </text>
            </g>
          );
        })}

        {data.map((d, i) =>
          (n - 1 - i) % 3 === 0 ? (
            <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#6d809c">
              {fmt(d.day)}
            </text>
          ) : null,
        )}

        <rect className="holo-sweep" x="0" y={PT} width="46" height={H - PT - PB} fill="url(#holo-sweep-grad)" pointerEvents="none" />

        {series.map((s) => (
          <g key={s.id}>
            <path d={s.area} fill={`url(#holo-area-${s.id})`} opacity={ready ? 1 : 0} style={{ transition: "opacity 1.4s ease 0.5s" }} />
            <path
              d={s.line}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={ready ? 0 : 1}
              style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.2,0.8,0.2,1)", filter: `drop-shadow(0 0 6px ${s.color})` }}
            />
            {s.pts.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={hover === i ? 4.5 : 2.5} fill="#0a1220" stroke={s.color} strokeWidth="1.8" />
            ))}
            {s.pts.length > 0 && (
              <circle className="holo-ping" cx={s.pts[s.pts.length - 1][0]} cy={s.pts[s.pts.length - 1][1]} r="4" fill={s.color} />
            )}
          </g>
        ))}

        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={base} stroke={ACCENT} strokeOpacity="0.6" strokeDasharray="4 4" />
            <g transform={`translate(${tipX}, ${PT})`}>
              <rect width="150" height={24 + series.length * 15} rx="8" fill="#0a1220" fillOpacity="0.92" stroke={ACCENT} strokeOpacity="0.6" />
              <text x="10" y="17" fontSize="11" fill="#a8b8d0">
                {fmt(data[hover].day)}
              </text>
              {series.map((s, i) => (
                <text key={s.id} x="10" y={32 + i * 15} fontSize="11" fill={s.color}>
                  {s.tip}: {data[hover][s.key]}
                </text>
              ))}
            </g>
          </g>
        )}

        {data.map((d, i) => (
          <rect
            key={d.day}
            x={x(i) - (step || W) / 2}
            y={PT}
            width={step || W}
            height={H - PT - PB}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
    </div>
  );
}

export type StatusSlice = { label: string; value: number; color: string };

/** Barra apilada del estado del inventario. */
export function HoloStatusBar({ data }: { data: StatusSlice[] }) {
  const ready = useReady();
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <p className="text-sm text-muted">Sin anuncios todavía.</p>;
  return (
    <div>
      <div className="flex h-5 w-full gap-1 rounded-full bg-bg/70 p-0.5 ring-1 ring-accent/15">
        {data
          .filter((d) => d.value > 0)
          .map((d, i) => (
            <div
              key={d.label}
              className="holo-bar-fill h-full rounded-full"
              title={`${d.label}: ${d.value}`}
              style={{
                width: ready ? `${(d.value / total) * 100}%` : "0%",
                transition: `width 1s cubic-bezier(0.2,0.8,0.2,1) ${i * 110}ms`,
                background: d.color,
                boxShadow: `0 0 12px ${d.color}`,
              }}
            />
          ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2 rounded-lg bg-bg/40 px-3 py-2">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }} />
              {d.label}
            </span>
            <span className="tabular-nums text-muted">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
