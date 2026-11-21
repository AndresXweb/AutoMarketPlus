import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HoloActivity, HoloDonut, HoloPage, HoloPanel, HoloStat, HoloStatusBar } from "@/components/holo-dashboard";
import { Badge } from "@/components/ui/badge";
import { bucketByDay, countBy, formatCopCompact } from "@/lib/holo-stats";
import { OFFER_TYPE_LABEL, STATUS_LABEL, formatCop } from "@/lib/format";
import { adminListDeals, adminListOffers, type Deal, type Offer } from "@/lib/market";

export const Route = createFileRoute("/admin/ofertas")({ component: OfertasAdmin });

const OFFER_STATUS_COLORS: Record<string, string> = {
  pendiente: "#f0b429",
  contraoferta: "#38bdf8",
  aceptada: "#3dba86",
  rechazada: "#ff6b6b",
  cerrada: "#6d809c",
};

function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

function OfertasAdmin() {
  const [rows, setRows] = useState<Offer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tab, setTab] = useState<"ofertas" | "deals">("deals");

  useEffect(() => {
    adminListOffers()
      .then(setRows)
      .catch(() => setRows([]));
    adminListDeals()
      .then(setDeals)
      .catch(() => setDeals([]));
  }, []);

  const stats = useMemo(() => {
    const open = rows.filter((o) => o.status === "pendiente" || o.status === "contraoferta").length;
    const accepted = rows.filter((o) => o.status === "aceptada").length;
    const volume = deals.reduce((sum, d) => sum + (d.finalAmount ?? 0), 0);
    return {
      open,
      accepted,
      volume,
      activity: bucketByDay(
        rows.map((o) => o.createdAt),
        deals.map((d) => d.acceptedAt),
      ),
      types: countBy(rows, (o) => o.offerType).map(([k, value]) => ({
        name: OFFER_TYPE_LABEL[k] ?? k,
        value,
      })),
      statuses: countBy(rows, (o) => o.status).map(([k, value]) => ({
        label: statusLabel(k),
        value,
        color: OFFER_STATUS_COLORS[k] ?? "#6d809c",
      })),
    };
  }, [rows, deals]);

  return (
    <HoloPage
      title="Ofertas y negocios"
      subtitle={`${rows.length} ofertas · ${deals.length} negocios concretados`}
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <HoloStat label="Ofertas" value={rows.length} />
        <HoloStat label="Abiertas" value={stats.open} alert={stats.open > 0} />
        <HoloStat label="Aceptadas" value={stats.accepted} />
        <HoloStat label="Negocios concretados" value={deals.length} />
        <HoloStat label="Monto concretado" value={stats.volume} format={formatCopCompact} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <HoloPanel
          title="Actividad · últimos 14 días"
          subtitle="Ofertas creadas y negocios concretados por día"
          className="lg:col-span-2"
        >
          <HoloActivity
            data={stats.activity}
            series={[
              { key: "listings", legend: "Ofertas creadas", tip: "Ofertas" },
              { key: "offers", legend: "Negocios concretados", tip: "Negocios" },
            ]}
            ariaLabel="Ofertas y negocios de los últimos 14 días"
          />
        </HoloPanel>
        <HoloPanel title="Por tipo" subtitle="Compra o permuta">
          <HoloDonut data={stats.types} />
        </HoloPanel>
      </div>

      <HoloPanel title="Estado de las ofertas" subtitle="Dónde están las negociaciones" className="mt-6">
        <HoloStatusBar data={stats.statuses} />
      </HoloPanel>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("deals")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "deals" ? "holo-nav-active" : "border-accent/20 bg-surface/60 text-muted hover:text-fg"
          }`}
        >
          Negocios concretados
        </button>
        <button
          type="button"
          onClick={() => setTab("ofertas")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "ofertas" ? "holo-nav-active" : "border-accent/20 bg-surface/60 text-muted hover:text-fg"
          }`}
        >
          Todas las ofertas
        </button>
      </div>

      {tab === "deals" ? (
        <ul className="mt-6 grid gap-3">
          {deals.length === 0 && (
            <p className="text-sm text-muted">Aún no hay negocios cerrados.</p>
          )}
          {deals.map((d) => (
            <li key={d.id} className="holo-row p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success">Concretado</Badge>
                <Badge>{OFFER_TYPE_LABEL[d.offerType] ?? d.offerType}</Badge>
                <span className="text-xs text-muted tabular-nums">
                  {new Date(d.acceptedAt).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <Link
                to="/vehiculo/$id"
                params={{ id: String(d.vehicleId) }}
                className="mt-2 block font-medium"
              >
                {d.vehicleTitle ?? `Vehículo #${d.vehicleId}`}
              </Link>
              <p className="mt-1 text-sm text-muted">
                Vendedor: <strong>{d.sellerName ?? d.sellerId}</strong>
                {" · "}
                Comprador: <strong>{d.buyerName ?? d.buyerId}</strong>
              </p>
              {d.finalAmount != null && (
                <p className="mt-1 text-sm font-medium tabular-nums text-accent">
                  Monto final: {formatCop(d.finalAmount)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                Oferta #{d.offerId} · Aceptó: {d.acceptedBy}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid gap-3">
          {rows.map((o) => (
            <li
              key={o.id}
              className={`holo-row p-4 ${o.status === "pendiente" ? "holo-row-warn" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    o.status === "pendiente"
                      ? "warn"
                      : o.status === "aceptada"
                        ? "success"
                        : "neutral"
                  }
                >
                  {statusLabel(o.status)}
                </Badge>
                <Badge>{OFFER_TYPE_LABEL[o.offerType]}</Badge>
                {o.acceptedAt && (
                  <span className="text-xs text-muted">
                    Cerrada:{" "}
                    {new Date(o.acceptedAt).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </div>
              <Link
                to="/vehiculo/$id"
                params={{ id: String(o.vehicleId) }}
                className="mt-2 block font-medium"
              >
                {o.vehicleTitle}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {o.buyerName ?? "Usuario"} ·{" "}
                {o.offerType === "compra" && o.amount != null
                  ? formatCop(o.finalAmount ?? o.amount)
                  : (o.swapTitle ?? "Permuta")}
              </p>
              {o.message && <p className="mt-2 text-sm text-muted">{o.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </HoloPage>
  );
}
