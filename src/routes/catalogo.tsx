import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { VehicleCard } from "@/components/vehicle-card";
import { Input, Select } from "@/components/ui/input";
import { BRANDS, CITIES } from "@/lib/format";
import { listVehicles, type Vehicle } from "@/lib/market";

export const Route = createFileRoute("/catalogo")({
  loader: () => listVehicles({ data: {} }),
  component: Catalogo,
});

/** Solo dígitos; vacío permitido. */
function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function Catalogo() {
  const initial = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [listingType, setListingType] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [city, setCity] = useState("");
  const [fuel, setFuel] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [items, setItems] = useState<Vehicle[]>(initial);
  const [loading, setLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const min = minPrice ? Number(minPrice) : undefined;
      const max = maxPrice ? Number(maxPrice) : undefined;

      if (min != null && (!Number.isFinite(min) || min < 0)) {
        setFilterError("El precio mínimo no es válido.");
        return;
      }
      if (max != null && (!Number.isFinite(max) || max < 0)) {
        setFilterError("El precio máximo no es válido.");
        return;
      }
      if (min != null && max != null && min > max) {
        setFilterError("El precio mínimo no puede ser mayor que el máximo.");
        return;
      }
      setFilterError(null);

      setLoading(true);
      listVehicles({
        data: {
          q: q || undefined,
          brand: brand || undefined,
          listingType: listingType || undefined,
          bodyType: bodyType || undefined,
          city: city || undefined,
          fuel: fuel || undefined,
          minPrice: min,
          maxPrice: max,
          verifiedOnly: verifiedOnly || undefined,
        },
      })
        .then(setItems)
        .catch((err) => {
          setItems([]);
          const msg = err instanceof Error ? err.message : "Error al filtrar.";
          toast.error(msg);
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(t);
  }, [q, brand, listingType, bodyType, city, fuel, minPrice, maxPrice, verifiedOnly]);

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Inventario</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Catálogo</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Solo anuncios aprobados. Los vendedores verificados llevan sello visible.
        </p>

        <div className="mt-8 grid gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Marca, línea o ciudad"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              suppressHydrationWarning
            />
          </div>
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Todas las marcas</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
          <Select value={listingType} onChange={(e) => setListingType(e.target.value)}>
            <option value="">Venta y permuta</option>
            <option value="venta">Venta</option>
            <option value="permuta">Permuta</option>
          </Select>
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Todas las ciudades</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
            <option value="">Carrocería</option>
            <option value="sedan">Sedán</option>
            <option value="suv">SUV</option>
            <option value="pickup">Pickup</option>
            <option value="hatchback">Hatchback</option>
            <option value="van">Van</option>
            <option value="coupe">Coupé</option>
          </Select>
          <Select value={fuel} onChange={(e) => setFuel(e.target.value)}>
            <option value="">Combustible</option>
            <option value="gasolina">Gasolina</option>
            <option value="diesel">Diésel</option>
            <option value="hibrido">Híbrido</option>
            <option value="electrico">Eléctrico</option>
          </Select>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            placeholder="Precio min"
            value={minPrice}
            onChange={(e) => setMinPrice(onlyDigits(e.target.value))}
          />
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            placeholder="Precio max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(onlyDigits(e.target.value))}
          />
          <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            Solo vendedores verificados
          </label>
        </div>

        {filterError && (
          <p className="mt-3 text-sm text-danger">{filterError}</p>
        )}

        <p className="mt-5 text-sm text-muted">
          {loading
            ? "Buscando…"
            : filterError
              ? "Corrige el rango de precios para buscar."
              : `${items.length} vehículo${items.length === 1 ? "" : "s"}`}
        </p>

        {!filterError && items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted">No hay vehículos con esos filtros.</p>
        ) : !filterError ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        ) : null}
      </main>
    </SiteShell>
  );
}
