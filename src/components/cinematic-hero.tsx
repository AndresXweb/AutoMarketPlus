import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

interface CinematicHeroProps {
  stats: {
    active: number;
    sale: number;
    swap: number;
    verified: number;
  };
}

export function CinematicHero({ stats }: CinematicHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // ===== Texto flotante (entrada + float) =====
    const ctxGsap = gsap.context(() => {
      gsap.from(".hero-label", {
        opacity: 0,
        y: 18,
        duration: 0.9,
        ease: "power3.out",
      });

      gsap.from(".hero-title span", {
        opacity: 0,
        y: 45,
        filter: "blur(12px)",
        duration: 1.15,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.12,
      });

      gsap.from(".hero-desc", {
        opacity: 0,
        y: 28,
        duration: 1,
        ease: "power3.out",
        delay: 0.4,
      });

      gsap.from(".hero-cta", {
        opacity: 0,
        y: 22,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.55,
      });

      gsap.from(".hero-stat", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.09,
        ease: "power3.out",
        delay: 0.45,
      });

      // Float suave continuo del texto
      gsap.to(".float-text", {
        y: -8,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // El hero se queda fijo mientras el carro de fondo se desarma
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=160%",
        pin: true,
        anticipatePin: 1,
      });
    }, section);

    return () => {
      ctxGsap.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      {/* Rejilla */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Sombra a la izquierda para que el texto siempre se lea */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05080f]/90 via-[#05080f]/35 to-transparent pointer-events-none" />
      {/* Fundido hacia la siguiente sección */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05080f] to-transparent pointer-events-none" />

      {/* Contenido (texto flotante) */}
      <div className="relative z-20 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-24">
        <div className="max-w-xl float-text">
          <p className="hero-label text-xs font-semibold uppercase tracking-[0.22em] text-teal-400">
            Marketplace de vehículos
          </p>

          <h1 className="hero-title mt-5 font-display text-4xl font-semibold leading-[1.08] text-white md:text-5xl lg:text-6xl">
            <span className="inline-block">Compra,</span>{" "}
            <span className="inline-block">vende</span>{" "}
            <span className="inline-block">o</span>
            <br />
            <span className="inline-block">permuta</span>{" "}
            <span className="inline-block">con</span>{" "}
            <span className="inline-block">confianza.</span>
          </h1>

          <p className="hero-desc mt-6 max-w-md text-base leading-relaxed text-slate-400">
            AutoMarket conecta dueños reales en Colombia. Publica tu vehículo,
            envía una oferta formal o propone una permuta clara y segura.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/catalogo" className="hero-cta">
              <Button
                size="lg"
                className="bg-teal-400 text-slate-900 hover:bg-teal-300 shadow-[0_0_28px_rgba(45,212,191,0.3)]"
              >
                Ver catálogo <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
            <Link to="/publicar" className="hero-cta">
              <Button
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Publicar anuncio
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats abajo a la derecha del texto, sin cruzarse */}
        <div className="mt-14 grid max-w-md grid-cols-2 gap-3">
          {[
            { label: "Activos", value: stats.active },
            { label: "En venta", value: stats.sale },
            { label: "Permuta", value: stats.swap },
            { label: "Verificados", value: stats.verified },
          ].map((s) => (
            <div
              key={s.label}
              className="hero-stat rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                {s.label}
              </p>
              <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-white">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Indicador scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 text-slate-500">
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <div className="h-10 w-[1px] bg-gradient-to-b from-teal-400/70 to-transparent" />
      </div>
    </section>
  );
}
