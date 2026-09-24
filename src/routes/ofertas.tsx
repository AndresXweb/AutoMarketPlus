import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { OFFER_TYPE_LABEL, STATUS_LABEL, formatCop, mailtoHref, whatsappHref } from "@/lib/format";
import {
  counterOffer,
  listMyOffers,
  listMyVehicles,
  respondOffer,
  type Offer,
  type Vehicle,
} from "@/lib/market";

export const Route = createFileRoute("/ofertas")({ component: Ofertas });

function tone(status: string) {
  if (status === "pendiente" || status === "contraoferta") return "warn" as const;
  if (status === "aceptada") return "success" as const;
  if (status === "rechazada") return "danger" as const;
  return "neutral" as const;
}

function OfferCard({
  offer,
  userId,
  mine,
  onDone,
}: {
  offer: Offer;
  userId: string;
  mine: Vehicle[];
  onDone: () => void;
}) {
  const incoming = offer.vehicleOwnerId === userId;
  const open = offer.status === "pendiente" || offer.status === "contraoferta";
  const myTurn = open && offer.lastActorId !== userId;
  const [showCounter, setShowCounter] = useState(false);
  const [amount, setAmount] = useState(offer.amount != null ? String(offer.amount) : "");
  const [swapId, setSwapId] = useState(offer.swapVehicleId ? String(offer.swapVehicleId) : "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(status: "aceptada" | "rechazada") {
    setBusy(true);
    try {
      await respondOffer({ data: { id: offer.id, status } });
      toast.success(status === "aceptada" ? "Oferta aceptada. Ya puedes contactar a la otra parte aquí." : "Oferta rechazada.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  async function onCounter(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await counterOffer({
        data: {
          id: offer.id,
          amount: amount ? Number(amount) : undefined,
          swapVehicleId: swapId ? Number(swapId) : undefined,
          message,
        },
      });
      toast.success("Contraoferta enviada.");
      setShowCounter(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo contraofertar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row">
      {offer.vehicleImage && (
        <img src={offer.vehicleImage} alt="" className="h-24 w-full rounded-lg object-cover sm:h-20 sm:w-28" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={tone(offer.status)}>{STATUS_LABEL[offer.status]}</Badge>
          <Badge>{OFFER_TYPE_LABEL[offer.offerType]}</Badge>
          {incoming && offer.matchesPrefs === false && <Badge tone="warn">Fuera de preferencias</Badge>}
        </div>
        <Link to="/vehiculo/$id" params={{ id: String(offer.vehicleId) }} className="mt-2 block font-display text-lg font-semibold">
          {offer.vehicleTitle}
        </Link>
        <p className="mt-1 text-sm text-muted">
          {incoming ? offer.buyerName ?? "Comprador" : "Tú"} ·{" "}
          {offer.offerType === "compra" && offer.amount != null
            ? formatCop(offer.amount)
            : offer.swapTitle
              ? `Permuta por ${offer.swapTitle}${offer.amount ? ` + ${formatCop(offer.amount)}` : ""}`
              : "Permuta"}
        </p>
        {offer.message && <p className="mt-2 text-sm leading-relaxed text-muted">{offer.message}</p>}
        {offer.events && offer.events.length > 0 && (
          <ol className="mt-3 grid gap-1 border-l border-border pl-3 text-xs text-subtle">
            {offer.events.map((ev) => (
              <li key={ev.id}>
                <span className="text-muted">
                  {new Date(ev.createdAt).toLocaleString("es-CO", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                {" · "}
                {ev.actorName ?? "Usuario"} · {STATUS_LABEL[ev.action] ?? ev.action}
                {ev.amount != null ? ` · ${formatCop(ev.amount)}` : ""}
                {ev.message ? ` — ${ev.message}` : ""}
              </li>
            ))}
          </ol>
        )}
        {offer.status === "aceptada" && (
          <div className="mt-4 rounded-lg border border-accent/30 bg-elevated/40 p-3">
            <p className="text-sm font-medium text-accent">Negocio concretado</p>
            {offer.acceptedAt && (
              <p className="mt-1 text-xs text-muted">
                {new Date(offer.acceptedAt).toLocaleString("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {offer.finalAmount != null ? ` · ${formatCop(offer.finalAmount)}` : ""}
              </p>
            )}
            <p className="mt-2 text-sm">
              Contacto de {offer.counterpartName ?? "la otra parte"}:
            </p>
            <ul className="mt-1 space-y-0.5 text-sm text-muted">
              {offer.counterpartWhatsapp && <li>WhatsApp: {offer.counterpartWhatsapp}</li>}
              {offer.counterpartPhone && !offer.counterpartWhatsapp && (
                <li>Teléfono: {offer.counterpartPhone}</li>
              )}
              {offer.counterpartPhone &&
                offer.counterpartWhatsapp &&
                offer.counterpartPhone !== offer.counterpartWhatsapp && (
                  <li>Teléfono: {offer.counterpartPhone}</li>
                )}
              {offer.counterpartEmail && <li>Correo: {offer.counterpartEmail}</li>}
              {!offer.counterpartWhatsapp && !offer.counterpartPhone && !offer.counterpartEmail && (
                <li className="text-subtle">
                  La otra parte no registró teléfono ni correo en su perfil.
                </li>
              )}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {offer.counterpartWhatsapp && (
                <a
                  href={whatsappHref(
                    offer.counterpartWhatsapp,
                    `Hola ${offer.counterpartName ?? ""}, soy de AutoMarket. Quedamos en el trato por ${offer.vehicleTitle ?? "el vehículo"}. ¿Coordinamos el cierre?`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button type="button" size="sm" variant="secondary">
                    WhatsApp
                  </Button>
                </a>
              )}
              {offer.counterpartEmail && (
                <a
                  href={mailtoHref(
                    offer.counterpartEmail,
                    `AutoMarket — ${offer.vehicleTitle ?? "Negocio"}`,
                    `Hola ${offer.counterpartName ?? ""},

Quedamos en el trato por ${offer.vehicleTitle ?? "el vehículo"} en AutoMarket.
¿Coordinamos el cierre?
`,
                  )}
                >
                  <Button type="button" size="sm" variant="outline">
                    Correo
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
        {myTurn && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => void act("aceptada")}>
              Aceptar
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void act("rechazada")}>
              Rechazar
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setShowCounter((v) => !v)}>
              Contraofertar
            </Button>
          </div>
        )}
        {open && !myTurn && (
          <p className="mt-3 text-xs text-subtle">Esperando respuesta de la otra parte.</p>
        )}
        {showCounter && myTurn && (
          <form onSubmit={onCounter} className="mt-4 grid gap-3 rounded-lg bg-elevated p-3">
            {offer.offerType === "compra" && (
              <Field label="Nuevo monto COP">
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </Field>
            )}
            {offer.offerType === "permuta" && (
              <>
                {!incoming && (
                  <Field label="Tu vehículo">
                    <Select value={swapId} onChange={(e) => setSwapId(e.target.value)}>
                      <option value="">Mantener el actual</option>
                      {mine.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field label="Diferencia COP (opcional)">
                  <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </Field>
              </>
            )}
            <Field label="Mensaje de la contraoferta">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={2} />
            </Field>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Enviando…" : "Enviar contraoferta"}
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}

function Ofertas() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<{ sent: Offer[]; received: Offer[] } | null>(null);
  const [mine, setMine] = useState<Vehicle[]>([]);

  async function reload() {
    const [offers, vehicles] = await Promise.all([listMyOffers(), listMyVehicles()]);
    setData(offers);
    setMine(vehicles.filter((v) => v.status === "activo"));
  }

  useEffect(() => {
    if (isPending || !user) return;
    reload().catch(() => setData({ sent: [], received: [] }));
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Negociación</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Ofertas</h1>
        <p className="mt-2 text-sm text-muted">
          Recibidas sobre tus anuncios y las que tú enviaste. Puedes aceptar, rechazar o contraofertar.
          Aceptar una cierra el anuncio.
        </p>

        <h2 className="mt-10 font-display text-xl font-semibold">Recibidas</h2>
        <div className="mt-4 grid gap-3">
          {data?.received.length ? (
            data.received.map((o) => (
              <OfferCard key={o.id} offer={o} userId={user.id} mine={mine} onDone={() => void reload()} />
            ))
          ) : (
            <p className="text-sm text-muted">Nadie ha ofertado todavía por tus carros.</p>
          )}
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">Enviadas</h2>
        <div className="mt-4 grid gap-3">
          {data?.sent.length ? (
            data.sent.map((o) => (
              <OfferCard key={o.id} offer={o} userId={user.id} mine={mine} onDone={() => void reload()} />
            ))
          ) : (
            <p className="text-sm text-muted">Aún no envías ofertas. Entra a un anuncio del catálogo.</p>
          )}
        </div>
      </main>
    </SiteShell>
  );
}
