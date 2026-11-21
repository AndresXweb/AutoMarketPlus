import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HoloActivity,
  HoloBars,
  HoloDonut,
  HoloPanel,
  HoloStat,
  HoloStatusBar,
  LiveBadge,
} from "@/components/holo-dashboard";
import { Badge } from "@/components/ui/badge";
import { adminStats } from "@/lib/market";
import { LISTING_LABEL, OFFER_TYPE_LABEL, STATUS_LABEL, formatCop } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const REFRESH_MS = 30_000;

const STATUS_COLORS: Record<string, string> = {
  activo: "#3dba86",
  pendiente_revision: "#f0b429",
  pausado: "#38bdf8",
  vendido: "#3dd6c6",
  rechazado: "#ff6b6b",
};

function AdminHome() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (document.hidden) return;
      adminStats()
        .then((res) => {
          if (cancelled) return;
          setData(res);
          setUpdatedAt(new Date());
        })
        .catch(() => {
          // Conserva los últimos datos si una actualización falla.
        });
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!data) {
    return <div className="h-48 animate-pulse rounded-xl bg-surface" />;
  }

  const cards = [
    { label: "Usuarios", value: data.users },
    { label: "Anuncios", value: data.vehicles },
    { label: "Ofertas abiertas", value: data.pending },
    { label: "Contactos", value: data.contacts },
    { label: "Anuncios en revisión", value: data.pendingListings, alert: data.pendingListings > 0 },
    { label: "Verificaciones", value: data.pendingVerifications, alert: data.pendingVerifications > 0 },
    { label: "Negocios del mes", value: data.dealsThisMonth },
    { label: "Solicitudes reactivación", value: data.reactivationRequests, alert: data.reactivationRequests > 0 },
  ];

  const operations = data.byType.map((r) => ({
    name: LISTING_LABEL[r.listing_type] ?? r.listing_type,
    value: r.c,
  }));
  const cities = data.byCity.map((r) => ({ name: r.city, n: r.c }));
  const statuses = data.byStatus.map((r) => ({
    label: STATUS_LABEL[r.status] ?? r.status,
    value: r.c,
    color: STATUS_COLORS[r.status] ?? "#6d809c",
  }));

  return (
    <div className="holo-grid-bg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="holo-title font-display text-3xl font-semibold">Panel</h1>
          <p className="mt-1 text-sm text-muted">Actividad del marketplace en tiempo real.</p>
        </div>
        <LiveBadge updatedAt={updatedAt} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <HoloStat key={c.label} label={c.label} value={c.value} alert={c.alert} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link to="/admin/anuncios" className="text-accent">
          Revisar anuncios
        </Link>
        <Link to="/admin/verificaciones" className="text-accent">
          Revisar verificaciones
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <HoloPanel
          title="Actividad · últimos 14 días"
          subtitle="Anuncios publicados y ofertas creadas por día"
          className="lg:col-span-2"
        >
          <HoloActivity data={data.activity} />
        </HoloPanel>
        <HoloPanel title="Por operación" subtitle="Pasa el mouse sobre cada segmento">
          <HoloDonut data={operations} />
        </HoloPanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <HoloPanel title="Activos por ciudad" subtitle="Anuncios activos por ubicación">
          <HoloBars data={cities} />
        </HoloPanel>
        <HoloPanel title="Estado del inventario" subtitle="Todos los anuncios según su estado">
          <HoloStatusBar data={statuses} />
        </HoloPanel>
      </div>

      {data.recentDeals.length > 0 && (
        <HoloPanel className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="holo-title font-display text-lg font-semibold">Últimos negocios concretados</h2>
            <Link to="/admin/ofertas" className="text-sm text-accent">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 grid gap-3">
            {data.recentDeals.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {d.vehicleTitle ?? "Vehículo"} · {d.sellerName ?? "Vendedor"} → {d.buyerName ?? "Comprador"}
                  {d.finalAmount != null ? ` · ${formatCop(d.finalAmount)}` : ""}
                </span>
                <span className="text-xs text-muted tabular-nums">
                  {new Date(d.acceptedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </HoloPanel>
      )}

      <HoloPanel title="Ofertas recientes" className="mt-6">
        <ul className="grid gap-3">
          {data.recentOffers.length === 0 && <li className="text-sm text-muted">Todavía no hay ofertas.</li>}
          {data.recentOffers.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {o.buyerName ?? "Usuario"} · {o.vehicleTitle} · {OFFER_TYPE_LABEL[o.offerType]}
                {o.amount ? ` · ${formatCop(o.amount)}` : ""}
              </span>
              <Badge
                tone={
                  o.status === "pendiente" || o.status === "contraoferta"
                    ? "warn"
                    : o.status === "aceptada"
                      ? "success"
                      : "neutral"
                }
              >
                {STATUS_LABEL[o.status]}
              </Badge>
            </li>
          ))}
        </ul>
      </HoloPanel>
    </div>
  );
}
