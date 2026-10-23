import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, Shield, Tag } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { featuredVehicles, marketStats } from "@/lib/market";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [vehicles, stats] = await Promise.all([featuredVehicles(), marketStats()]);
    return { vehicles, stats };
  },
  component: Home,
});

function Home() {
  const { vehicles, stats } = Route.useLoaderData();

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        {/* Luces de ambiente */}
        <div className="am-orb left-[-10%] top-[-20%] h-[420px] w-[420px] bg-accent/30" />
        <div className="am-orb right-[-8%] top-[10%] h-[360px] w-[360px] bg-sky-500/25" />
        <div className="am-orb bottom-[-10%] left-[30%] h-[280px] w-[280px] bg-accent/15" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-12 md:py-24">
          {/* Texto */}
          <div className="relative z-10 md:col-span-6">
            <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Marketplace de vehículos
            </p>
            <h1 className="am-hero-title mt-5 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
              Compra, vende o permuta con confianza.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
              AutoMarket conecta dueños reales en Colombia. Publica tu vehículo,
              envía una oferta formal o propone una permuta clara y segura.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalogo">
                <Button size="lg" className="shadow-[0_0_24px_-4px_rgba(61,214,198,0.55)]">
                  Ver catálogo <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/publicar">
                <Button size="lg" variant="outline">
                  Publicar anuncio
                </Button>
              </Link>
            </div>
          </div>

          {/* Carro flotante 3D + stats */}
          <div className="relative z-10 md:col-span-6">
            <div className="am-float-car relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent/25 via-sky-500/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.4rem] border border-accent/25 bg-elevated/40 shadow-[var(--shadow-float)]">
                <img
                  src="/vehicles/hero.jpg"
                  alt="Vehículo destacado"
                  className="aspect-[16/11] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-white/5" />
              </div>
              {/* reflejo / base */}
              <div className="mx-auto mt-3 h-3 w-3/4 rounded-full bg-accent/20 blur-md" />
            </div>

            <div className="am-float-soft am-glass relative z-20 mx-auto -mt-8 grid max-w-sm grid-cols-2 gap-2 rounded-2xl p-3">
              {[
                { label: "Activos", value: stats.active },
                { label: "En venta", value: stats.sale },
                { label: "Permuta", value: stats.swap },
                { label: "Verificados", value: stats.verified },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-bg/50 px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent/90">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-fg">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Tag,
              title: "Comprar",
              text: "Filtra por marca, ciudad, precio y tipo. Envía una oferta formal o contraoferta al vendedor.",
            },
            {
              icon: Shield,
              title: "Vender",
              text: "Publica fotos, papeles y condiciones. Si no estás verificado, un administrador aprueba el anuncio.",
            },
            {
              icon: RefreshCw,
              title: "Permutar",
              text: "Define qué tipo de vehículo recibes: marca, línea, kilometraje y el resto de filtros.",
            },
          ].map((item) => (
            <div key={item.title} className="am-card-3d rounded-2xl border border-border/80 bg-surface/90 p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <item.icon className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-fg">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Selección</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Destacados</h2>
          </div>
          <Link to="/catalogo" className="text-sm text-muted hover:text-accent">
            Ver todos
          </Link>
        </div>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay anuncios activos.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <div key={v.id} className="am-card-3d rounded-2xl">
                <VehicleCard vehicle={v} />
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
