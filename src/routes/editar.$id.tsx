import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { onNonNegIntInput } from "@/lib/input-rules";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BRANDS, CITIES } from "@/lib/format";
import { compressImageFile } from "@/lib/images";
import { getVehicle, updateMyVehicle, type Vehicle } from "@/lib/market";
import type { SwapPrefs } from "@/lib/swap";

export const Route = createFileRoute("/editar/$id")({ component: EditarAnuncio });

function EditarAnuncio() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [listingType, setListingType] = useState<"venta" | "permuta" | "ambos">("venta");
  const [taxesCurrent, setTaxesCurrent] = useState(true);
  const [finesCurrent, setFinesCurrent] = useState(true);
  const [swapAny, setSwapAny] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(true);
  const [acceptLowerOffers, setAcceptLowerOffers] = useState(true);
  const [customMinPercent, setCustomMinPercent] = useState(false);
  const [minOfferPercent, setMinOfferPercent] = useState("70");

  useEffect(() => {
    if (isPending || !user) return;
    getVehicle({ data: { id: Number(id) } })
      .then((v) => {
        if (!v || v.userId !== user.id) {
          toast.error("No tienes permiso para editar este anuncio.");
          void navigate({ to: "/mis-anuncios" });
          return;
        }
        if (v.status === "vendido") {
          toast.error("No se puede editar un anuncio vendido.");
          void navigate({ to: "/mis-anuncios" });
          return;
        }
        setVehicle(v);
        setImages(v.images?.length ? v.images : [v.imageUrl]);
        setListingType((v.listingType as typeof listingType) || "venta");
        setTaxesCurrent(v.taxesCurrent);
        setFinesCurrent(v.finesCurrent);
        setSwapAny(v.swapAny);
        setShowWhatsapp(v.showWhatsapp !== false);
        setAcceptLowerOffers(v.acceptLowerOffers !== false);
        if (v.minOfferPercent != null) {
          setCustomMinPercent(true);
          setMinOfferPercent(String(v.minOfferPercent));
        }
      })
      .catch(() => {
        toast.error("Anuncio no encontrado.");
        void navigate({ to: "/mis-anuncios" });
      });
  }, [id, user, isPending, navigate]);

  if (isPending || !vehicle) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const next = [...images];
      for (const file of Array.from(files)) {
        if (next.length >= 6) break;
        next.push(await compressImageFile(file));
      }
      setImages(next.slice(0, 6));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar las fotos.");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!images.length) {
      toast.error("Sube al menos una foto del vehículo.");
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
      const res = await updateMyVehicle({
        data: {
          id: Number(id),
          title: String(fd.get("title")),
          brand: String(fd.get("brand")),
          model: String(fd.get("model")),
          year: Number(fd.get("year")),
          mileage: Number(fd.get("mileage")),
          price: Number(fd.get("price")),
          condition: String(fd.get("condition")) as "nuevo" | "seminuevo" | "usado",
          fuel: String(fd.get("fuel")) as "gasolina" | "diesel" | "hibrido" | "electrico",
          transmission: String(fd.get("transmission")) as "manual" | "automatica",
          bodyType: String(fd.get("bodyType")) as "sedan" | "suv" | "pickup" | "hatchback" | "van" | "coupe",
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
          ? "Anuncio actualizado y publicado."
          : "Anuncio actualizado. Quedó en revisión.",
      );
      void navigate({ to: "/mis-anuncios" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Editar anuncio</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Editar publicación</h1>
        {vehicle.status === "rechazado" && (
          <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            Este anuncio fue rechazado. Corrige lo indicado y guárdalo para reenviarlo a revisión.
            {vehicle.rejectionNote ? <> <strong>Motivo:</strong> {vehicle.rejectionNote}</> : null}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <Field label="Título">
            <Input name="title" required minLength={3} defaultValue={vehicle.title} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca">
              <Select name="brand" required defaultValue={vehicle.brand}>
                {BRANDS.map((b) => (<option key={b}>{b}</option>))}
              </Select>
            </Field>
            <Field label="Línea de vehículo">
              <Input name="model" required defaultValue={vehicle.model} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Año">
              <Input name="year" type="text" inputMode="numeric" required defaultValue={vehicle.year} onInput={onNonNegIntInput} />
            </Field>
            <Field label="Kilometraje">
              <Input name="mileage" type="text" inputMode="numeric" required defaultValue={vehicle.mileage} onInput={onNonNegIntInput} />
            </Field>
            <Field label="Precio COP">
              <Input name="price" type="text" inputMode="numeric" required defaultValue={vehicle.price} onInput={onNonNegIntInput} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado">
              <Select name="condition" defaultValue={vehicle.condition}>
                <option value="usado">Usado</option>
                <option value="seminuevo">Seminuevo</option>
                <option value="nuevo">Nuevo</option>
              </Select>
            </Field>
            <Field label="Operación">
              <Select name="listingType" value={listingType} onChange={(e) => setListingType(e.target.value as typeof listingType)}>
                <option value="venta">Venta</option>
                <option value="permuta">Permuta</option>
                <option value="ambos">Venta o permuta</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Combustible">
              <Select name="fuel" defaultValue={vehicle.fuel}>
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diésel</option>
                <option value="hibrido">Híbrido</option>
                <option value="electrico">Eléctrico</option>
              </Select>
            </Field>
            <Field label="Caja">
              <Select name="transmission" defaultValue={vehicle.transmission}>
                <option value="automatica">Automática</option>
                <option value="manual">Manual</option>
              </Select>
            </Field>
            <Field label="Carrocería">
              <Select name="bodyType" defaultValue={vehicle.bodyType}>
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
            <Select name="city" defaultValue={vehicle.city}>
              {CITIES.map((c) => (<option key={c}>{c}</option>))}
            </Select>
          </Field>
          <Field label="Descripción">
            <Textarea name="description" required minLength={10} defaultValue={vehicle.description} />
          </Field>
          <div className="rounded-xl border border-border bg-surface/60 p-4">
            <p className="mb-1 text-sm font-medium text-muted">Fotos (máximo 6)</p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }}
            />
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((src, i) => (
                  <button key={`${i}-${src.slice(0, 30)}`} type="button" onClick={() => setImages((c) => c.filter((_, idx) => idx !== i))} className="relative h-20 w-28 overflow-hidden rounded-md">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</Button>
            <Link to="/mis-anuncios"><Button type="button" variant="ghost">Cancelar</Button></Link>
          </div>
        </form>
      </main>
    </SiteShell>
  );
}
