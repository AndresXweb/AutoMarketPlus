import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Mail, MapPin, MessageCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ImageGallery } from "@/components/image-gallery";
import { PapersPanel } from "@/components/papers-panel";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea, Input } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  BODY_LABEL,
  CONDITION_LABEL,
  FUEL_LABEL,
  LISTING_LABEL,
  TRANS_LABEL,
  formatCop,
  formatKm,
  mailtoHref,
  whatsappHref,
} from "@/lib/format";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  createOffer,
  getVehicle,
  isFavorite,
  listMyVehicles,
  toggleFavorite,
  type Vehicle,
} from "@/lib/market";
import { vehicleMatchesPrefs } from "@/lib/swap";

export const Route = createFileRoute("/vehiculo/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return getVehicle({ data: { id } });
  },
  component: Detalle,
});

function Detalle() {
  const { id } = Route.useParams();
  const vehicleId = Number(id);
  const loaded = Route.useLoaderData();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(loaded);
  const [fav, setFav] = useState(false);
  const [mine, setMine] = useState<Vehicle[]>([]);
  const [offerType, setOfferType] = useState<"compra" | "permuta">("compra");
  const [amount, setAmount] = useState("");
  const [swapId, setSwapId] = useState("");
  const [message, setMessage] = useState("");
  const [needAuth, setNeedAuth] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVehicle(loaded);
  }, [loaded]);

  useEffect(() => {
    if (!user) return;
    isFavorite({ data: { vehicleId } })
      .then((r) => setFav(r.favorite))
      .catch(() => undefined);
    listMyVehicles()
      .then((rows) => setMine(rows.filter((v) => v.status === "activo")))
      .catch(() => setMine([]));
  }, [user, vehicleId]);

  useEffect(() => {
    if (!vehicle) return;
    setOfferType(vehicle.listingType === "permuta" ? "permuta" : "compra");
  }, [vehicle]);

  if (vehicle === undefined) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="aspect-video animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }

  if (!vehicle) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold">Anuncio no encontrado</h1>
          <Link to="/catalogo" className="mt-4 inline-block text-sm text-accent">
            Volver al catálogo
          </Link>
        </main>
      </SiteShell>
    );
  }

  if (needAuth) return <RedirectToSignIn />;

  const own = user?.id === vehicle.userId;
  const listingTone =
    vehicle.listingType === "permuta" ? "warn" : vehicle.listingType === "ambos" ? "accent" : "success";

  const selectedSwap = mine.find((v) => String(v.id) === swapId);
  const swapMatch =
    selectedSwap && vehicle.listingType !== "venta"
      ? vehicleMatchesPrefs(selectedSwap, vehicle.swapPrefs)
      : null;

  const preset = `Hola ${vehicle.sellerName ?? ""}, vi tu ${vehicle.title} en AutoMarket (${formatCop(vehicle.price)}) y me interesa. ¿Sigue disponible?`;

  async function onFav() {
    if (!user) {
      setNeedAuth(true);
      return;
    }
    try {
      const res = await toggleFavorite({ data: { vehicleId } });
      setFav(res.favorite);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  async function onOffer(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setNeedAuth(true);
      return;
    }
    if (offerType === "compra") {
      const n = Number(amount);
      if (!amount || Number.isNaN(n) || n <= 0) {
        toast.error("Indica un monto válido.");
        return;
      }
      if (n > vehicle.price) {
        toast.error("La oferta no puede ser mayor al precio publicado.");
        return;
      }
      if (vehicle.acceptLowerOffers === false && n < vehicle.price) {
        toast.error("El vendedor solo acepta el precio publicado.");
        return;
      }
      if (
        vehicle.acceptLowerOffers !== false &&
        vehicle.minOfferPercent != null &&
        vehicle.minOfferPercent > 0
      ) {
        const floor = Math.ceil((vehicle.price * vehicle.minOfferPercent) / 100);
        if (n < floor) {
          toast.error(`La oferta mínima es ${floor.toLocaleString("es-CO")} COP.`);
          return;
        }
      }
    }
    setBusy(true);
    try {
      await createOffer({
        data: {
          vehicleId,
          offerType,
          amount: amount ? Number(amount) : undefined,
          swapVehicleId: swapId ? Number(swapId) : undefined,
          message: message || undefined,
        },
      });
      toast.success("Oferta enviada.");
      void navigate({ to: "/ofertas" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  }

  const specs = [
    { label: "Año", value: String(vehicle.year) },
    { label: "Línea", value: vehicle.model },
    { label: "Kilometraje", value: formatKm(vehicle.mileage) },
    { label: "Estado", value: CONDITION_LABEL[vehicle.condition] ?? vehicle.condition },
    { label: "Combustible", value: FUEL_LABEL[vehicle.fuel] ?? vehicle.fuel },
    { label: "Caja", value: TRANS_LABEL[vehicle.transmission] ?? vehicle.transmission },
    { label: "Carrocería", value: BODY_LABEL[vehicle.bodyType] ?? vehicle.bodyType },
  ];

  const wa = vehicle.sellerWhatsapp ? whatsappHref(vehicle.sellerWhatsapp, preset) : "";
  const mail = vehicle.sellerEmail
    ? mailtoHref(vehicle.sellerEmail, `Interés en ${vehicle.title}`, preset)
    : "";

  return (
    <SiteShell>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ImageGallery images={vehicle.images.length ? vehicle.images : [vehicle.imageUrl]} alt={vehicle.title} />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label} className="rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs uppercase tracking-wider text-subtle">{s.label}</p>
                <p className="mt-1 text-sm font-medium">{s.value}</p>
              </div>
            ))}
          </div>
          <PapersPanel vehicle={vehicle} />
          {vehicle.listingType !== "venta" && (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-semibold">Permuta</h2>
              {vehicle.swapPrefs.any ? (
                <p className="mt-3 text-sm text-muted">El vendedor recibe cualquier tipo de vehículo.</p>
              ) : (
                <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                  {vehicle.swapPrefs.brand && <li>Marca: {vehicle.swapPrefs.brand}</li>}
                  {vehicle.swapPrefs.model && <li>Línea: {vehicle.swapPrefs.model}</li>}
                  {vehicle.swapPrefs.yearMin && <li>Año desde: {vehicle.swapPrefs.yearMin}</li>}
                  {vehicle.swapPrefs.yearMax && <li>Año hasta: {vehicle.swapPrefs.yearMax}</li>}
                  {vehicle.swapPrefs.mileageMax != null && (
                    <li>Kilometraje máx.: {formatKm(vehicle.swapPrefs.mileageMax)}</li>
                  )}
                  {vehicle.swapPrefs.bodyType && (
                    <li>Carrocería: {BODY_LABEL[vehicle.swapPrefs.bodyType] ?? vehicle.swapPrefs.bodyType}</li>
                  )}
                  {vehicle.swapPrefs.fuel && (
                    <li>Combustible: {FUEL_LABEL[vehicle.swapPrefs.fuel] ?? vehicle.swapPrefs.fuel}</li>
                  )}
                  {vehicle.swapPrefs.city && <li>Ciudad: {vehicle.swapPrefs.city}</li>}
                </ul>
              )}
            </section>
          )}
          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Descripción</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{vehicle.description}</p>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)] lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={listingTone}>{LISTING_LABEL[vehicle.listingType]}</Badge>
                  {vehicle.status !== "activo" && (
                    <Badge tone="warn">{vehicle.status === "pendiente_revision" ? "En revisión" : vehicle.status}</Badge>
                  )}
                  {own && typeof vehicle.activeOffersCount === "number" && vehicle.activeOffersCount > 0 && (
                    <Badge tone="accent">
                      {vehicle.activeOffersCount} oferta{vehicle.activeOffersCount === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
                <h1 className="mt-3 font-display text-3xl font-semibold">{vehicle.title}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {vehicle.brand} · {vehicle.model} · {vehicle.sellerName ?? "Particular"}
                  {vehicle.sellerVerified && <VerifiedBadge />}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onFav()}
                className="grid size-11 place-items-center rounded-md border border-border"
                aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
              >
                <Heart className={fav ? "size-5 fill-accent text-accent" : "size-5 text-muted"} />
              </button>
            </div>
            <p className="mt-5 font-display text-3xl font-semibold tabular-nums text-accent">
              {formatCop(vehicle.price)}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted">
              <MapPin className="size-4" /> {vehicle.city}
            </p>

            {!own && vehicle.status === "activo" && (wa || mail) && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer">
                    <Button type="button" className="w-full" variant="secondary">
                      <MessageCircle className="size-4" /> WhatsApp
                    </Button>
                  </a>
                )}
                {mail && (
                  <a href={mail}>
                    <Button type="button" className="w-full" variant="outline">
                      <Mail className="size-4" /> Correo
                    </Button>
                  </a>
                )}
              </div>
            )}

            {own ? (
              <p className="mt-6 rounded-md bg-elevated px-3 py-3 text-sm text-muted">
                Este anuncio es tuyo. Gestiona ofertas desde{" "}
                <Link to="/ofertas" className="text-accent">
                  Ofertas
                </Link>
                .
              </p>
            ) : vehicle.status !== "activo" ? (
              <p className="mt-6 text-sm text-muted">Este anuncio ya no está activo.</p>
            ) : (
              <form onSubmit={onOffer} className="mt-6 grid gap-3">
                <Field label="Tipo de oferta">
                  <Select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as "compra" | "permuta")}
                  >
                    {vehicle.listingType !== "permuta" && <option value="compra">Compra</option>}
                    {vehicle.listingType !== "venta" && <option value="permuta">Permuta</option>}
                  </Select>
                </Field>
                {offerType === "compra" && (
                  <Field label="Monto (COP)">
                    <Input
                      type="number"
                      min={0}
                      max={vehicle.price}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder={String(vehicle.price)}
                    />
                    <p className="mt-1 text-xs text-muted">
                      Máximo {vehicle.price.toLocaleString("es-CO")} COP (precio publicado).
                      {vehicle.acceptLowerOffers === false
                        ? " El vendedor solo acepta el precio exacto."
                        : vehicle.minOfferPercent
                          ? ` Oferta mínima: ${vehicle.minOfferPercent}% del precio.`
                          : " Se aceptan ofertas menores."}
                    </p>
                  </Field>
                )}
                {offerType === "permuta" && (
                  <Field label="Tu vehículo">
                    {mine.length === 0 ? (
                      <p className="text-sm text-muted">
                        Publica un anuncio propio para permutar.{" "}
                        <Link to="/publicar" className="text-accent">
                          Publicar
                        </Link>
                      </p>
                    ) : (
                      <Select value={swapId} onChange={(e) => setSwapId(e.target.value)} required>
                        <option value="">Elige uno de tus anuncios</option>
                        {mine.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}
                {swapMatch === false && (
                  <p className="text-xs text-warn">
                    Este vehículo no coincide del todo con lo que el vendedor quiere recibir. Igual puedes ofertar.
                  </p>
                )}
                {offerType === "permuta" && (
                  <Field label="Diferencia en COP (opcional)">
                    <Input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Si ofreces plata encima"
                    />
                  </Field>
                )}
                <Field label="Mensaje">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cuéntale al vendedor cómo quieres cerrar."
                  />
                </Field>
                {isPending ? (
                  <div className="h-11 animate-pulse rounded-md bg-elevated" />
                ) : (
                  <Button type="submit" disabled={busy || (offerType === "permuta" && mine.length === 0)}>
                    {busy ? "Enviando…" : "Enviar oferta"}
                  </Button>
                )}
              </form>
            )}
          </div>
        </aside>
      </main>
    </SiteShell>
  );
}
