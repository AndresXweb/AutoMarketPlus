import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { OFFER_TYPE_LABEL, STATUS_LABEL, formatCop } from "@/lib/format";
import { adminListDeals, adminListOffers, type Deal, type Offer } from "@/lib/market";

export const Route = createFileRoute("/admin/ofertas")({ component: OfertasAdmin });

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

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Ofertas y negocios</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length} ofertas · {deals.length} negocios concretados
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("deals")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "deals" ? "bg-accent text-bg" : "bg-surface text-muted"
          }`}
        >
          Negocios concretados
        </button>
        <button
          type="button"
          onClick={() => setTab("ofertas")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "ofertas" ? "bg-accent text-bg" : "bg-surface text-muted"
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
            <li key={d.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
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
            <li key={o.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
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
                  {STATUS_LABEL[o.status]}
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
    </div>
  );
}
