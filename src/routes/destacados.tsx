import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { listFeaturedVehicles } from "@/lib/market";

export const Route = createFileRoute("/destacados")({
  loader: () => listFeaturedVehicles(),
  component: Destacados,
});

function Destacados() {
  const items = Route.useLoaderData();

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Selección</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Destacados</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Anuncios activos elegidos por el equipo de AutoMarket.
        </p>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-muted">Por ahora no hay vehículos destacados.</p>
            <Link to="/catalogo" className="mt-4 inline-block">
              <Button>Ver el catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
