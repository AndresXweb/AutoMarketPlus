import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/verified-badge";
import { LISTING_LABEL, STATUS_LABEL, formatCop } from "@/lib/format";
import {
  adminExtendListing,
  adminListReactivationRequests,
  adminListVehicles,
  adminSetVehicleStatus,
  type Vehicle,
} from "@/lib/market";

export const Route = createFileRoute("/admin/anuncios")({ component: Anuncios });

function Anuncios() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<Vehicle[]>([]);
  const [extendDays, setExtendDays] = useState<Record<number, string>>({});
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const [all, reqs] = await Promise.all([
        adminListVehicles(),
        adminListReactivationRequests().catch(() => [] as Vehicle[]),
      ]);
      setRows(all);
      setRequests(reqs);
    } catch {
      setRows([]);
      setRequests([]);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const pending = rows.filter((v) => v.status === "pendiente_revision").length;

  async function setStatus(
    id: number,
    status: "activo" | "pausado" | "vendido" | "rechazado" | "pendiente_revision",
    note?: string,
  ) {
    setBusy(true);
    try {
      await adminSetVehicleStatus({
        data: { id, status, note },
      });
      toast.success(
        status === "rechazado"
          ? "Anuncio rechazado. El vendedor verá el motivo."
          : `Estado actualizado: ${STATUS_LABEL[status] ?? status}`,
      );
      setRejectId(null);
      setRejectNote("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  function openReject(id: number) {
    setRejectId(id);
    setRejectNote("");
  }

  function confirmReject() {
    if (rejectId == null) return;
    const note = rejectNote.trim();
    if (note.length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    void setStatus(rejectId, "rechazado", note);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Anuncios</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length} publicados. {pending} en espera de aprobación.
        {requests.length > 0 && ` · ${requests.length} solicitud(es) de reactivación.`}
      </p>

      {requests.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-500/40 bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Solicitudes de reactivación</h2>
          <ul className="mt-3 grid gap-3">
            {requests.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Link to="/vehiculo/$id" params={{ id: String(v.id) }} className="font-medium">
                  {v.title}
                </Link>
                <span className="text-muted">{v.sellerName}</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={extendDays[v.id] ?? "30"}
                  onChange={(e) =>
                    setExtendDays((prev) => ({ ...prev, [v.id]: e.target.value.replace(/\D/g, "") }))
                  }
                  className="w-16 rounded border border-border bg-bg px-2 py-1"
                  aria-label="Días a otorgar"
                />
                <span className="text-xs text-muted">días</span>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    const days = Number(extendDays[v.id] ?? 30);
                    if (!Number.isFinite(days) || days < 1) {
                      toast.error("Indica un número de días válido (1–365).");
                      return;
                    }
                    void adminExtendListing({ data: { id: v.id, days } })
                      .then(() => {
                        toast.success(`Anuncio extendido ${days} días.`);
                        return reload();
                      })
                      .catch((err) =>
                        toast.error(err instanceof Error ? err.message : "No se pudo extender."),
                      );
                  }}
                >
                  Extender
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejectId != null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg">
            <h2 className="font-display text-xl font-semibold">Motivo del rechazo</h2>
            <p className="mt-1 text-sm text-muted">
              El vendedor verá este texto en Mis anuncios. Sé claro y concreto.
            </p>
            <textarea
              className="mt-4 min-h-28 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm"
              placeholder="Ej: Las fotos no muestran la placa ni el odómetro. Sube imágenes legibles y vuelve a enviar."
              value={rejectNote}
              maxLength={400}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <p className="mt-1 text-xs text-subtle">{rejectNote.trim().length}/400 (mín. 10)</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setRejectId(null);
                  setRejectNote("");
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={confirmReject}>
                Confirmar rechazo
              </Button>
            </div>
          </div>
        </div>
      )}

      <ul className="mt-6 grid gap-3">
        {rows.map((v) => (
          <li
            key={v.id}
            className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center"
          >
            <img src={v.imageUrl} alt="" className="h-20 w-full rounded-lg object-cover sm:w-32" />
            <div className="min-w-0 flex-1">
              <Link to="/vehiculo/$id" params={{ id: String(v.id) }} className="font-medium">
                {v.title}
              </Link>
              <p className="text-sm text-muted">
                {v.sellerName} · {v.city} · {formatCop(v.price)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  tone={
                    v.status === "activo"
                      ? "success"
                      : v.status === "pausado" || v.status === "pendiente_revision"
                        ? "warn"
                        : "neutral"
                  }
                >
                  {STATUS_LABEL[v.status]}
                </Badge>
                <Badge>{LISTING_LABEL[v.listingType]}</Badge>
                {v.sellerVerified && <VerifiedBadge />}
              </div>
              {v.status === "rechazado" && v.rejectionNote && (
                <p className="mt-2 text-xs text-danger">Motivo: {v.rejectionNote}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {v.status === "pendiente_revision" && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void setStatus(v.id, "activo")}
                >
                  Aprobar
                </Button>
              )}
              {(
                [
                  ["activo", "Activo"],
                  ["pausado", "Pausado"],
                  ["vendido", "Vendido"],
                ] as const
              ).map(([s, label]) => (
                <Button
                  key={s}
                  size="sm"
                  variant={v.status === s ? "default" : "secondary"}
                  disabled={busy}
                  onClick={() => void setStatus(v.id, s)}
                >
                  {label}
                </Button>
              ))}
              <Button
                size="sm"
                variant={v.status === "rechazado" ? "default" : "danger"}
                disabled={busy}
                onClick={() => openReject(v.id)}
              >
                Rechazar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
