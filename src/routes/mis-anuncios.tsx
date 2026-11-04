import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  LISTING_LABEL,
  STATUS_LABEL,
  formatCop,
  formatDate,
  isExpired,
  isExpiringSoon,
} from "@/lib/format";
import {
  deleteMyVehicle,
  listMyVehicles,
  updateVehicleStatus,
  type Vehicle,
} from "@/lib/market";

export const Route = createFileRoute("/mis-anuncios")({ component: MisAnuncios });

function toneFor(status: string) {
  if (status === "activo") return "success" as const;
  if (status === "pausado" || status === "pendiente_revision") return "warn" as const;
  if (status === "vendido") return "accent" as const;
  return "danger" as const;
}

function paperLine(label: string, value: string | null | undefined) {
  if (!value) return null;
  if (isExpired(value)) {
    return (
      <p className="mt-1 text-xs text-danger">
        {label} vencido ({formatDate(value)}). Renueva antes de cerrar tratos.
      </p>
    );
  }
  if (isExpiringSoon(value, 30)) {
    return (
      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
        {label} vence el {formatDate(value)} (próximo a vencer).
      </p>
    );
  }
  return null;
}

function MisAnuncios() {
  const { user, isPending } = useCurrentUserState();
  const [items, setItems] = useState<Vehicle[] | null>(null);

  async function reload() {
    const rows = await listMyVehicles();
    setItems(rows);
  }

  useEffect(() => {
    if (isPending || !user) return;
    reload().catch(() => setItems([]));
  }, [user, isPending]);

  if (isPending) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">
              Tu inventario
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">Mis anuncios</h1>
          </div>
          <Link to="/publicar">
            <Button size="sm">Publicar</Button>
          </Link>
        </div>

        {items === null ? (
          <div className="mt-8 h-32 animate-pulse rounded-xl bg-surface" />
        ) : items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted">
            Todavía no publicas. Empieza con un anuncio para poder permutar.
          </p>
        ) : (
          <ul className="mt-8 grid gap-3">
            {items.map((v) => (
              <li
                key={v.id}
                className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center"
              >
                <img
                  src={v.imageUrl}
                  alt=""
                  className="h-24 w-full rounded-lg object-cover sm:w-36"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/vehiculo/$id"
                    params={{ id: String(v.id) }}
                    className="font-display text-lg font-semibold"
                  >
                    {v.title}
                  </Link>
                  <p className="mt-1 text-sm tabular-nums text-muted">{formatCop(v.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={toneFor(v.status)}>{STATUS_LABEL[v.status] ?? v.status}</Badge>
                    <Badge>{LISTING_LABEL[v.listingType]}</Badge>
                  </div>
                  {v.status === "pendiente_revision" && (
                    <p className="mt-2 text-xs text-muted">
                      En revisión. Si verificas tu cuenta, los siguientes anuncios salen de
                      inmediato.
                    </p>
                  )}
                  {v.status === "rechazado" && (
                    <p className="mt-2 rounded-md border border-danger/30 bg-danger/5 px-2 py-1.5 text-xs text-danger">
                      <strong>Rechazado.</strong>{" "}
                      {v.rejectionNote?.trim()
                        ? v.rejectionNote
                        : "Sin motivo detallado. Contacta soporte si necesitas aclaración."}
                    </p>
                  )}
                  {v.status === "pausado" && v.pausedReason === "inactividad" && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Pausado por inactividad (30 días sin movimiento).
                      {(v.freeReactivationsUsed ?? 0) < 1
                        ? " Puedes reactivar gratis una vez más (+30 días)."
                        : v.reactivationRequestedAt
                          ? " Ya solicitaste reactivación; un admin la revisará."
                          : " Debes solicitar reactivación al administrador."}
                    </p>
                  )}
                  {paperLine("SOAT", v.soatExpires)}
                  {paperLine("Tecnomecánica", v.tecnoExpires)}
                  {v.status === "activo" &&
                    typeof v.activeOffersCount === "number" &&
                    v.activeOffersCount > 0 && (
                      <p className="mt-2 text-xs text-accent">
                        {v.activeOffersCount} oferta
                        {v.activeOffersCount === 1 ? "" : "s"} activa
                        {v.activeOffersCount === 1 ? "" : "s"}
                      </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.status === "pausado" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void updateVehicleStatus({ data: { id: v.id, status: "activo" } })
                          .then(
                            (res: {
                              ok?: boolean;
                              requested?: boolean;
                              free?: boolean;
                              message?: string;
                            }) => {
                              if (res?.requested) {
                                toast.message(
                                  res.message ?? "Solicitud enviada al administrador.",
                                );
                              } else if (res?.free) {
                                toast.success("Anuncio reactivado por 30 días más.");
                              } else {
                                toast.success("Anuncio activado.");
                              }
                              return reload();
                            },
                          )
                          .catch((err) =>
                            toast.error(
                              err instanceof Error ? err.message : "No se pudo activar.",
                            ),
                          );
                      }}
                    >
                      {v.pausedReason === "inactividad" && (v.freeReactivationsUsed ?? 0) >= 1
                        ? "Solicitar reactivación"
                        : "Activar"}
                    </Button>
                  )}
                  {v.status === "activo" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void updateVehicleStatus({ data: { id: v.id, status: "pausado" } }).then(
                          reload,
                        )
                      }
                    >
                      Pausar
                    </Button>
                  )}
                  {v.status !== "vendido" &&
                    v.status !== "pendiente_revision" &&
                    v.status !== "rechazado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void updateVehicleStatus({ data: { id: v.id, status: "vendido" } }).then(
                            reload,
                          )
                        }
                      >
                        Vendido
                      </Button>
                    )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      void deleteMyVehicle({ data: { id: v.id } })
                        .then(() => {
                          toast.success("Anuncio eliminado.");
                          return reload();
                        })
                        .catch((err) =>
                          toast.error(err instanceof Error ? err.message : "No se pudo borrar."),
                        );
                    }}
                  >
                    Borrar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
