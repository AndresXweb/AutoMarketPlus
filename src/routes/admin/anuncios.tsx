import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoloDonut, HoloPage, HoloPanel, HoloStat, HoloStatusBar } from "@/components/holo-dashboard";
import { Input, Select } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/verified-badge";
import { LISTING_LABEL, STATUS_LABEL, formatCop } from "@/lib/format";
import {
  adminExtendListing,
  adminListReactivationRequests,
  adminListVehicles,
  adminSetFeatured,
  adminSetVehicleStatus,
  type Vehicle,
} from "@/lib/market";

export const Route = createFileRoute("/admin/anuncios")({ component: Anuncios });

const STATUS_COLORS: Record<string, string> = {
  activo: "#3dba86",
  pendiente_revision: "#f0b429",
  pausado: "#38bdf8",
  vendido: "#3dd6c6",
  rechazado: "#ff6b6b",
};

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente_revision", label: "En revisión" },
  { value: "activo", label: "Activos" },
  { value: "pausado", label: "Pausados" },
  { value: "vendido", label: "Vendidos" },
  { value: "rechazado", label: "Rechazados" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Anuncios() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<Vehicle[]>([]);
  const [extendDays, setExtendDays] = useState<Record<number, string>>({});
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [search, setSearch] = useState("");
  const [listingFilter, setListingFilter] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

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

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: rows.length };
    for (const v of rows) c[v.status] = (c[v.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return rows.filter((v) => {
      if (statusFilter !== "todos" && v.status !== statusFilter) return false;
      if (listingFilter && v.listingType !== listingFilter) return false;
      if (onlyFeatured && !v.featured) return false;
      if (term) {
        const haystack = normalize(
          [v.title, v.brand, v.model, v.city, v.sellerName ?? ""].join(" "),
        );
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, listingFilter, onlyFeatured, search]);

  const hasFilters =
    statusFilter !== "todos" || search.trim() !== "" || listingFilter !== "" || onlyFeatured;

  const featuredCount = useMemo(() => rows.filter((v) => v.featured).length, [rows]);
  const operations = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of rows) m.set(v.listingType, (m.get(v.listingType) ?? 0) + 1);
    return [...m.entries()].map(([k, value]) => ({ name: LISTING_LABEL[k] ?? k, value }));
  }, [rows]);

  function clearFilters() {
    setStatusFilter("todos");
    setSearch("");
    setListingFilter("");
    setOnlyFeatured(false);
  }

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

  async function toggleFeatured(v: Vehicle) {
    setBusy(true);
    try {
      await adminSetFeatured({ data: { id: v.id, featured: !v.featured } });
      toast.success(v.featured ? "Quitado de destacados." : "Anuncio destacado.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  function openReject(id: number) {
    const current = rows.find((r) => r.id === id);
    if (current?.status === "rechazado") {
      toast.error("Este anuncio ya fue rechazado.");
      return;
    }
    setRejectId(id);
    setRejectNote("");
  }

  function confirmReject() {
    if (rejectId == null || busy) return;
    const note = rejectNote.trim();
    if (note.length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    void setStatus(rejectId, "rechazado", note);
  }

  return (
    <HoloPage
      title="Anuncios"
      subtitle={
        <>
          {rows.length} publicados. {pending} en espera de aprobación.
          {requests.length > 0 && ` · ${requests.length} solicitud(es) de reactivación.`}
        </>
      }
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <HoloStat label="Anuncios" value={rows.length} />
        <HoloStat label="Activos" value={counts.activo ?? 0} />
        <HoloStat label="En revisión" value={pending} alert={pending > 0} />
        <HoloStat label="Rechazados" value={counts.rechazado ?? 0} />
        <HoloStat label="Destacados" value={featuredCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <HoloPanel title="Estado del inventario" subtitle="Anuncios según su estado">
          <HoloStatusBar
            data={Object.keys(STATUS_COLORS).map((st) => ({
              label: STATUS_LABEL[st] ?? st,
              value: counts[st] ?? 0,
              color: STATUS_COLORS[st],
            }))}
          />
        </HoloPanel>
        <HoloPanel title="Por operación" subtitle="Venta, permuta o ambas">
          <HoloDonut data={operations} />
        </HoloPanel>
      </div>

      {requests.length > 0 && (
        <div className="holo-panel holo-corners holo-alert mt-6 p-4">
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
          <div className="holo-panel holo-corners w-full max-w-md p-5">
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

      <div className="holo-panel holo-corners mt-6 grid gap-3 p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              role="tab"
              aria-selected={statusFilter === f.value}
              variant={statusFilter === f.value ? "default" : "secondary"}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label} ({counts[f.value] ?? 0})
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar por título, marca, vendedor o ciudad"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={listingFilter} onChange={(e) => setListingFilter(e.target.value)}>
            <option value="">Venta y permuta</option>
            <option value="venta">Venta</option>
            <option value="permuta">Permuta</option>
            <option value="ambos">Venta o permuta</option>
          </Select>
          <label className="flex h-11 items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={onlyFeatured}
              onChange={(e) => setOnlyFeatured(e.target.checked)}
            />
            Solo destacados
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>
            Mostrando {filtered.length} de {rows.length} anuncio{rows.length === 1 ? "" : "s"}
          </span>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted">
          No hay anuncios con esos filtros.
        </p>
      )}

      <ul className="mt-6 grid gap-3">
        {filtered.map((v) => (
          <li
            key={v.id}
            className={`holo-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${v.status === "pendiente_revision" ? "holo-row-warn" : v.status === "rechazado" ? "holo-row-danger" : ""}`}
          >
            <img src={v.imageUrl} alt="" className="h-20 w-full rounded-lg object-cover ring-1 ring-accent/30 sm:w-32" />
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
              {v.status === "rechazado" ? (
                <span className="text-xs text-muted">
                  Anuncio rechazado. No admite más acciones.
                </span>
              ) : (
                <>
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
                  ).map(([st, label]) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={v.status === st ? "default" : "secondary"}
                      disabled={busy}
                      onClick={() => void setStatus(v.id, st)}
                    >
                      {label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void toggleFeatured(v)}
                  >
                    {v.featured ? "Quitar destacado" : "Destacar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy}
                    onClick={() => openReject(v.id)}
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </HoloPage>
  );
}
