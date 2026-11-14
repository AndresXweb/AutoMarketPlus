import { Link } from "@tanstack/react-router";
import { Gauge, MapPin } from "lucide-react";
import type { Vehicle } from "@/lib/market";
import { BODY_LABEL, LISTING_LABEL, formatCop, formatKm } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const listingTone =
    vehicle.listingType === "permuta"
      ? "warn"
      : vehicle.listingType === "ambos"
        ? "accent"
        : "success";
  const cover = vehicle.images[0] ?? vehicle.imageUrl;

  return (
    <Link
      to="/vehiculo/$id"
      params={{ id: String(vehicle.id) }}
      className="group flex flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden bg-elevated">
        <img
          src={cover}
          alt={vehicle.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {vehicle.featured && <Badge tone="accent">★ Destacado</Badge>}
          <Badge tone={listingTone}>{LISTING_LABEL[vehicle.listingType]}</Badge>
          {vehicle.sellerVerified && <VerifiedBadge />}
        </div>
        {vehicle.images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-bg/70 px-2 py-0.5 text-xs text-fg">
            {vehicle.images.length} fotos
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">
            {vehicle.brand} · {vehicle.model} · {vehicle.year}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-fg">
            {vehicle.title}
          </h3>
        </div>
        <p className="font-display text-xl font-semibold tabular-nums text-accent">
          {formatCop(vehicle.price)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Gauge className="size-3.5" />
            {formatKm(vehicle.mileage)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {vehicle.city}
          </span>
          <span>{BODY_LABEL[vehicle.bodyType] ?? vehicle.bodyType}</span>
        </div>
      </div>
    </Link>
  );
}
