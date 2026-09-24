import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BRANDS, CITIES, STOCK_IMAGES } from "@/lib/format";
import { compressImageFile } from "@/lib/images";
import { createVehicle, getMyProfile } from "@/lib/market";
import type { SwapPrefs } from "@/lib/swap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/publicar")({ component: Publicar });

function Publicar() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([STOCK_IMAGES[0].src]);
  const [listingType, setListingType] = useState<"venta" | "permuta" | "ambos">("venta");
  const [taxesCurrent, setTaxesCurrent] = useState(true);
  const [finesCurrent, setFinesCurrent] = useState(true);
  const [swapAny, setSwapAny] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(true);
  const [acceptLowerOffers, setAcceptLowerOffers] = useState(true);
  const [customMinPercent, setCustomMinPercent] = useState(false);
  const [minOfferPercent, setMinOfferPercent] = useState("70");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    getMyProfile()
      .then((p) => {
        setVerified(p?.verificationStatus === "verificado" || p?.role === "admin");
        setDisabled(p?.accountStatus === "deshabilitado");
      })
      .catch(() => setVerified(false));
  }, [user, isPending]);

  if (isPending) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  function toggleStock(src: string) {
    setImages((curr) => {
      if (curr.includes(src)) return curr.filter((x) => x !== src);
      if (curr.length >= 6) {
        toast.error("Máximo 6 fotos.");
        return curr;
      }
      return [...curr, src];
    });
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    try {
      const next = [...images];
      for (const file of Array.from(files)) {
        if (next.length >= 6) break;
        next.push(await compressImageFile(file));
      }
      if (images.length + files.length > 6) toast.error("Se tomaron solo las primeras hasta 6.");
      setImages(next.slice(0, 6));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar las fotos.");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!images.length) {
      toast.error("Agrega al menos una foto.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const swapPrefs: SwapPrefs = swapAny
        ? { any: true }
        : {
            any: false,
            brand: String(fd.get("swapBrand") || "") || undefined,
            model: String(fd.get("swapModel") || "") || undefined,
            yearMin: fd.get("swapYearMin") ? Number(fd.get("swapYearMin")) : undefined,
            yearMax: fd.get("swapYearMax") ? Number(fd.get("swapYearMax")) : undefined,
            mileageMax: fd.get("swapMileageMax") ? Number(fd.get("swapMileageMax")) : undefined,
            condition: String(fd.get("swapCondition") || "") || undefined,
            fuel: String(fd.get("swapFuel") || "") || undefined,
            transmission: String(fd.get("swapTransmission") || "") || undefined,
            bodyType: String(fd.get("swapBodyType") || "") || undefined,
            city: String(fd.get("swapCity") || "") || undefined,
            priceMin: fd.get("swapPriceMin") ? Number(fd.get("swapPriceMin")) : undefined,
            priceMax: fd.get("swapPriceMax") ? Number(fd.get("swapPriceMax")) : undefined,
          };
      const res = await createVehicle({
        data: {
          title: String(fd.get("title")),
          brand: String(fd.get("brand")),
          model: String(fd.get("model")),
          year: Number(fd.get("year")),
          mileage: Number(fd.get("mileage")),
          price: Number(fd.get("price")),
          condition: String(fd.get("condition")) as "nuevo" | "seminuevo" | "usado",
          fuel: String(fd.get("fuel")) as "gasolina" | "diesel" | "hibrido" | "electrico",
          transmission: String(fd.get("transmission")) as "manual" | "automatica",
          bodyType: String(fd.get("bodyType")) as
            | "sedan"
            | "suv"
            | "pickup"
            | "hatchback"
            | "van"
            | "coupe",
          city: String(fd.get("city")),
          description: String(fd.get("description")),
          images,
          listingType,
          soatExpires: String(fd.get("soatExpires") || "") || undefined,
          tecnoExpires: String(fd.get("tecnoExpires") || "") || undefined,
          taxesCurrent,
          taxesDetail: String(fd.get("taxesDetail") || "") || undefined,
          taxesAmount: fd.get("taxesAmount") ? Number(fd.get("taxesAmount")) : undefined,
          finesCurrent,
          finesDetail: String(fd.get("finesDetail") || "") || undefined,
          finesAmount: fd.get("finesAmount") ? Number(fd.get("finesAmount")) : undefined,
          swapPrefs: listingType === "venta" ? { any: true } : swapPrefs,
          showWhatsapp,
          acceptLowerOffers: listingType === "permuta" ? true : acceptLowerOffers,
          minOfferPercent:
            listingType !== "permuta" && acceptLowerOffers && customMinPercent
              ? Number(minOfferPercent)
              : null,
        },
      });
      toast.success(
        res.status === "activo"
          ? "Anuncio publicado."
          : "Anuncio enviado a revisión. Será público cuando un administrador lo apruebe.",
      );
      void navigate({ to: "/vehiculo/$id", params: { id: String(res.id) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo publicar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">
          Vender o permutar
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Publicar anuncio</h1>
        {disabled ? (
          <p className="mt-4 rounded-md bg-danger/15 px-3 py-3 text-sm text-danger">
            Tu cuenta está deshabilitada.
          </p>
        ) : verified === false ? (
          <p className="mt-4 rounded-md bg-elevated px-3 py-3 text-sm text-muted">
            Todavía no estás verificado: el anuncio queda en revisión hasta que un administrador lo
            apruebe.{" "}
            <Link to="/perfil" className="text-accent">
              Verifica tu cédula
            </Link>{" "}
            para publicar de inmediato.
          </p>
        ) : verified ? (
          <p className="mt-4 text-sm text-muted">
            Cuenta verificada: el anuncio sale público apenas lo publiques.
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <Field label="Título">
            <Input name="title" required minLength={3} placeholder="Mazda CX-5 Grand Touring 2020" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca">
              <Select name="brand" required defaultValue="Toyota">
                {BRANDS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Línea de vehículo">
              <Input name="model" required placeholder="Corolla, CX-5, Onix Turbo…" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Año">
              <Input name="year" type="number" required min={1980} max={2030} defaultValue={2020} />
            </Field>
            <Field label="Kilometraje">
              <Input name="mileage" type="number" required min={0} defaultValue={40000} />
            </Field>
            <Field label="Precio COP">
              <Input name="price" type="number" required min={0} defaultValue={50000000} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado">
              <Select name="condition" defaultValue="usado">
                <option value="usado">Usado</option>
                <option value="seminuevo">Seminuevo</option>
                <option value="nuevo">Nuevo</option>
              </Select>
            </Field>
            <Field label="Operación">
              <Select
                name="listingType"
                value={listingType}
                onChange={(e) => setListingType(e.target.value as typeof listingType)}
              >
                <option value="venta">Venta</option>
                <option value="permuta">Permuta</option>
                <option value="ambos">Venta o permuta</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Combustible">
              <Select name="fuel" defaultValue="gasolina">
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diésel</option>
                <option value="hibrido">Híbrido</option>
                <option value="electrico">Eléctrico</option>
              </Select>
            </Field>
            <Field label="Caja">
              <Select name="transmission" defaultValue="automatica">
                <option value="automatica">Automática</option>
                <option value="manual">Manual</option>
              </Select>
            </Field>
            <Field label="Carrocería">
              <Select name="bodyType" defaultValue="sedan">
                <option value="sedan">Sedán</option>
                <option value="suv">SUV</option>
                <option value="pickup">Pickup</option>
                <option value="hatchback">Hatchback</option>
                <option value="van">Van</option>
                <option value="coupe">Coupé</option>
              </Select>
            </Field>
          </div>
          <Field label="Ciudad">
            <Select name="city" defaultValue="Bogotá">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Descripción">
            <Textarea name="description" required minLength={10} placeholder="Estado, extras, historia del vehículo…" />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-muted">Galería (máximo 6)</p>
            <p className="mb-3 text-xs text-subtle">Elige fotos de referencia o sube las tuyas. Se deslizan solas en el anuncio.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {STOCK_IMAGES.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => toggleStock(img.src)}
                  className={cn(
                    "overflow-hidden rounded-md",
                    images.includes(img.src) ? "ring-2 ring-accent" : "ring-1 ring-border",
                  )}
                  aria-label={img.label}
                >
                  <img src={img.src} alt="" className="aspect-square object-cover" />
                </button>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-3 text-xs text-muted"
              onChange={(e) => void addFiles(e.target.files)}
            />
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImages((c) => c.filter((x) => x !== src))}
                    className="relative overflow-hidden rounded-md ring-1 ring-border"
                    aria-label="Quitar foto"
                  >
                    <img src={src} alt="" className="size-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-lg font-semibold">Papeles</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Vencimiento SOAT">
                <Input name="soatExpires" type="date" />
              </Field>
              <Field label="Vencimiento tecnomecánica">
                <Input name="tecnoExpires" type="date" />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={taxesCurrent}
                onChange={(e) => setTaxesCurrent(e.target.checked)}
              />
              Impuestos al día
            </label>
            {!taxesCurrent && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Cuáles impuestos no están al día">
                  <Input name="taxesDetail" placeholder="Rodamiento 2026, valorización…" />
                </Field>
                <Field label="Valor a deber (COP)">
                  <Input name="taxesAmount" type="number" min={0} defaultValue={0} />
                </Field>
              </div>
            )}
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={finesCurrent}
                onChange={(e) => setFinesCurrent(e.target.checked)}
              />
              Sin comparendos pendientes
            </label>
            {!finesCurrent && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Cuáles comparendos">
                  <Input name="finesDetail" placeholder="Foto-multa, exceso de velocidad…" />
                </Field>
                <Field label="Valor a deber (COP)">
                  <Input name="finesAmount" type="number" min={0} defaultValue={0} />
                </Field>
              </div>
            )}
          </div>

          {(listingType === "venta" || listingType === "ambos") && (
            <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-3">
              <p className="text-sm font-medium">Reglas de ofertas de compra</p>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptLowerOffers}
                  onChange={(e) => setAcceptLowerOffers(e.target.checked)}
                />
                <span>
                  Acepto ofertas <strong>menores</strong> al precio publicado.
                  <span className="block text-xs text-muted">
                    Si no marcas esto, solo se podrá ofertar el precio exacto. Nadie puede ofertar más del precio.
                  </span>
                </span>
              </label>
              {acceptLowerOffers && (
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={customMinPercent}
                    onChange={(e) => setCustomMinPercent(e.target.checked)}
                  />
                  <span className="flex-1">
                    Definir un porcentaje mínimo
                    {customMinPercent && (
                      <span className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={minOfferPercent}
                          onChange={(e) => setMinOfferPercent(e.target.value)}
                          className="w-20 rounded-md border border-border bg-bg px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-muted">% del precio (ej. 70 = mínimo 70%)</span>
                      </span>
                    )}
                    {!customMinPercent && (
                      <span className="block text-xs text-muted">Sin mínimo: aceptas cualquier oferta ≤ precio.</span>
                    )}
                  </span>
                </label>
              )}
            </div>
          )}

          <label className="flex items-start gap-2 text-sm rounded-xl border border-border bg-surface/60 p-4">
            <input
              type="checkbox"
              className="mt-1"
              checked={showWhatsapp}
              onChange={(e) => setShowWhatsapp(e.target.checked)}
            />
            <span>
              Mostrar mi WhatsApp en el anuncio
              <span className="block text-xs text-muted">
                Si lo desactivas, los interesados solo verán el correo (si lo tienes) o deberán ofertar.
              </span>
            </span>
          </label>

          {listingType !== "venta" && (
            <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <h2 className="font-display text-lg font-semibold">Qué recibes en permuta</h2>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={swapAny} onChange={(e) => setSwapAny(e.target.checked)} />
                Recibo cualquier tipo de vehículo
              </label>
              {!swapAny && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Marca">
                    <Select name="swapBrand" defaultValue="">
                      <option value="">Cualquiera</option>
                      {BRANDS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Línea de vehículo">
                    <Input name="swapModel" placeholder="Opcional" />
                  </Field>
                  <Field label="Año mínimo">
                    <Input name="swapYearMin" type="number" min={1980} max={2030} />
                  </Field>
                  <Field label="Año máximo">
                    <Input name="swapYearMax" type="number" min={1980} max={2030} />
                  </Field>
                  <Field label="Kilometraje máximo">
                    <Input name="swapMileageMax" type="number" min={0} />
                  </Field>
                  <Field label="Estado">
                    <Select name="swapCondition" defaultValue="">
                      <option value="">Cualquiera</option>
                      <option value="nuevo">Nuevo</option>
                      <option value="seminuevo">Seminuevo</option>
                      <option value="usado">Usado</option>
                    </Select>
                  </Field>
                  <Field label="Combustible">
                    <Select name="swapFuel" defaultValue="">
                      <option value="">Cualquiera</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diésel</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="electrico">Eléctrico</option>
                    </Select>
                  </Field>
                  <Field label="Caja">
                    <Select name="swapTransmission" defaultValue="">
                      <option value="">Cualquiera</option>
                      <option value="automatica">Automática</option>
                      <option value="manual">Manual</option>
                    </Select>
                  </Field>
                  <Field label="Carrocería">
                    <Select name="swapBodyType" defaultValue="">
                      <option value="">Cualquiera</option>
                      <option value="sedan">Sedán</option>
                      <option value="suv">SUV</option>
                      <option value="pickup">Pickup</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="van">Van</option>
                      <option value="coupe">Coupé</option>
                    </Select>
                  </Field>
                  <Field label="Ciudad">
                    <Select name="swapCity" defaultValue="">
                      <option value="">Cualquiera</option>
                      {CITIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Precio mínimo COP">
                    <Input name="swapPriceMin" type="number" min={0} />
                  </Field>
                  <Field label="Precio máximo COP">
                    <Input name="swapPriceMax" type="number" min={0} />
                  </Field>
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={busy || disabled}>
            {busy ? "Publicando…" : "Publicar"}
          </Button>
        </form>
      </main>
    </SiteShell>
  );
}
