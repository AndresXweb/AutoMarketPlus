import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BRANDS, CITIES, formatCop } from "@/lib/format";
import {
  closeSearchRequest,
  createSearchRequest,
  deleteSearchRequest,
  listMySearchRequests,
  type SearchRequest,
} from "@/lib/market";

export const Route = createFileRoute("/solicitudes")({ component: Solicitudes });

const onlyDigits = (raw: string) => raw.replace(/\D/g, "");

function Solicitudes() {
  const { user, isPending } = useCurrentUserState();
  const [items, setItems] = useState<SearchRequest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [city, setCity] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [notes, setNotes] = useState("");

  async function reload() {
    try {
      setItems(await listMySearchRequests());
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    if (isPending || !user) return;
    void reload();
  }, [user, isPending]);

  if (isPending) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const yMin = yearMin ? Number(yearMin) : undefined;
    const yMax = yearMax ? Number(yearMax) : undefined;
    if (yMin != null && yMax != null && yMin > yMax) {
      toast.error("El año mínimo no puede ser mayor que el máximo.");
      return;
    }
    setBusy(true);
    try {
      await createSearchRequest({
        data: {
          brand: brand || undefined,
          model: model.trim() || undefined,
          city: city || undefined,
          yearMin: yMin,
          yearMax: yMax,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          notes: notes.trim() || undefined,
        },
      });
      toast.success("Solicitud creada.");
      setBrand("");
      setModel("");
      setCity("");
      setYearMin("");
      setYearMax("");
      setMaxPrice("");
      setNotes("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<unknown>, okMsg: string) {
    setBusy(true);
    try {
      await action();
      toast.success(okMsg);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Compradores</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Solicitudes de búsqueda</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          ¿No encuentras lo que buscas? Cuéntanos qué vehículo quieres y te mostramos cuántos
          anuncios activos coinciden.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <form
            onSubmit={onSubmit}
            className="grid gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] lg:col-span-2"
          >
            <h2 className="font-display text-xl font-semibold">Nueva solicitud</h2>
            <Field label="Marca">
              <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">Cualquiera</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Línea / modelo">
              <Input
                value={model}
                maxLength={60}
                placeholder="Ej: Corolla, CX-30"
                onChange={(e) => setModel(e.target.value)}
              />
            </Field>
            <Field label="Ciudad">
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Cualquiera</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Año desde">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2018"
                  value={yearMin}
                  onChange={(e) => setYearMin(onlyDigits(e.target.value))}
                />
              </Field>
              <Field label="Año hasta">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2024"
                  value={yearMax}
                  onChange={(e) => setYearMax(onlyDigits(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Precio máximo (COP)">
              <Input
                inputMode="numeric"
                placeholder="80000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(onlyDigits(e.target.value))}
              />
            </Field>
            <Field label="Notas (opcional)">
              <Textarea
                value={notes}
                maxLength={400}
                placeholder="Ej: Prefiero automática, único dueño."
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Crear solicitud"}
            </Button>
          </form>

          <section className="lg:col-span-3">
            <h2 className="font-display text-xl font-semibold">Mis solicitudes</h2>
            {items === null ? (
              <div className="mt-4 h-32 animate-pulse rounded-xl bg-surface" />
            ) : items.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Aún no has creado solicitudes.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {items.map((r) => {
                  const title =
                    [r.brand, r.model].filter(Boolean).join(" ") || "Cualquier vehículo";
                  const details = [
                    r.city,
                    r.yearMin || r.yearMax
                      ? `${r.yearMin ?? "…"} – ${r.yearMax ?? "…"}`
                      : null,
                    r.maxPrice ? `hasta ${formatCop(r.maxPrice)}` : null,
                  ].filter(Boolean);
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{title}</p>
                        <Badge tone={r.status === "activa" ? "success" : "neutral"}>
                          {r.status === "activa" ? "Activa" : "Cerrada"}
                        </Badge>
                        {r.status === "activa" && (
                          <Badge tone={r.matches > 0 ? "accent" : "neutral"}>
                            {r.matches} coincidencia{r.matches === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>
                      {details.length > 0 && (
                        <p className="mt-1 text-sm text-muted">{details.join(" · ")}</p>
                      )}
                      {r.notes && <p className="mt-1 text-sm text-subtle">{r.notes}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.status === "activa" && r.matches > 0 && (
                          <Link to="/catalogo">
                            <Button size="sm">Ver catálogo</Button>
                          </Link>
                        )}
                        {r.status === "activa" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void run(
                                () => closeSearchRequest({ data: { id: r.id } }),
                                "Solicitud cerrada.",
                              )
                            }
                          >
                            Cerrar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() =>
                            void run(
                              () => deleteSearchRequest({ data: { id: r.id } }),
                              "Solicitud eliminada.",
                            )
                          }
                        >
                          Eliminar
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
