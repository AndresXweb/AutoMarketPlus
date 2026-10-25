import { useEffect, useRef } from "react";

type Tile = {
  x: number; y: number; w: number; h: number; // recorte en la imagen
  u: number; v: number; // posición relativa (0-1) del centro
  dl: number; // retraso
  vx: number; vy: number; r: number; z: number; // fuga, giro y profundidad
};

const TS = 11; // tamaño del fragmento (px de la imagen)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

const REVEAL =
  ".am-car ~ * :is(h1, h2, p, .am-card-3d, a:has(> button))";

/**
 * Carro de fondo: nítido cuando está armado; al bajar se rompe en
 * fragmentos y al subir se vuelve a armar. También maneja:
 * - barra de progreso del scroll
 * - menú que se oculta al bajar y aparece al subir
 * - transiciones de entrada de los textos y tarjetas (sin editarlos)
 * Úsalo UNA vez, como primer hijo dentro de <SiteShell> en la página de inicio.
 */
export function CarBackground({
  src = "/ferrari.webp",
  screens = 2.4, // cuántas pantallas de scroll tarda en desarmarse
}: {
  src?: string;
  screens?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const bar = barRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !bar || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const header = document.querySelector<HTMLElement>("header");
    const img = new Image();
    const tiles: Tile[] = [];
    let W = 0, H = 0, IW = 0, IH = 0;
    let bx = 0, by = 0, bw = 1, bh = 1;
    let mx = 0, my = 0, cmx = 0, cmy = 0;
    let target = 0, cur = 0, lastY = window.scrollY, raf = 0, alive = true;

    const size = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!IW) return;
      const mobile = W < 860;
      bw = mobile ? W * 1.02 : Math.min(W * 0.64, H * 1.9);
      bh = (bw * IH) / IW;
      bx = mobile ? (W - bw) / 2 : W - bw + W * 0.03;
      by = mobile ? H * 0.52 - bh / 2 : H * 0.56 - bh / 2;
    };

    const build = () => {
      IW = img.naturalWidth;
      IH = img.naturalHeight;
      const o = document.createElement("canvas");
      o.width = IW;
      o.height = IH;
      const c = o.getContext("2d");
      if (!c) return;
      c.drawImage(img, 0, 0);
      const d = c.getImageData(0, 0, IW, IH).data;
      for (let y = 0; y < IH; y += TS) {
        for (let x = 0; x < IW; x += TS) {
          const w = Math.min(TS, IW - x);
          const h = Math.min(TS, IH - y);
          let n = 0;
          for (let yy = y; yy < y + h; yy += 2)
            for (let xx = x; xx < x + w; xx += 2) if (d[(yy * IW + xx) * 4 + 3] > 20) n++;
          if (!n) continue;
          const a = Math.random() * Math.PI * 2;
          const s = 0.35 + Math.random();
          tiles.push({
            x, y, w, h,
            u: (x + w / 2) / IW,
            v: (y + h / 2) / IH,
            dl: Math.random() * 0.26 + (1 - x / IW) * 0.14,
            vx: Math.cos(a) * s * 640 + 200,
            vy: Math.sin(a) * s * 480 - 220,
            r: (Math.random() - 0.5) * 10,
            z: Math.random(),
          });
        }
      }
      size();
      frame();
    };

    const frame = () => {
      if (!alive) return;
      cur += (target - cur) * (reduce ? 1 : 0.085);
      if (Math.abs(target - cur) < 0.0004) cur = target;
      cmx += (mx - cmx) * 0.06;
      cmy += (my - cmy) * 0.06;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const p = cur, k = bw / IW, ox = cmx * -22, oy = cmy * -12;
      const now = performance.now() * 0.001;

      // sombra de piso
      const sa = 1 - clamp(p * 3, 0, 1);
      if (sa > 0) {
        ctx.save();
        ctx.globalAlpha = sa;
        ctx.translate(bx + bw * 0.5 + ox, by + bh * 0.97);
        ctx.scale(1, 0.09);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, bw * 0.52);
        g.addColorStop(0, "rgba(0,0,0,.85)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, bw * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (p < 0.0015) {
        ctx.drawImage(img, bx + ox, by + oy, bw, bh); // imagen completa, nítida
      } else {
        for (let i = 0; i < tiles.length; i++) {
          const q = tiles[i];
          const l = ease(clamp((p - q.dl * 0.9) / 0.6, 0, 1));
          const al = 1 - l * 0.9;
          if (al < 0.03) continue;
          const X = bx + q.u * bw + ox + q.vx * l * (0.55 + q.z);
          const Y = by + q.v * bh + oy + q.vy * l * (0.55 + q.z) - l * l * 170 * q.z + Math.sin(now + i) * l * 8;
          const sc = 1 - l * 0.45;
          const dw = q.w * k * sc + 0.7;
          const dh = q.h * k * sc + 0.7;
          ctx.save();
          ctx.translate(X, Y);
          ctx.rotate(q.r * l);
          ctx.globalAlpha = al;
          ctx.drawImage(img, q.x, q.y, q.w, q.h, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        }
      }

      // difumina el carro a la izquierda para que el texto se lea siempre
      if (W >= 860) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        const f = ctx.createLinearGradient(0, 0, bx + bw * 0.16, 0);
        f.addColorStop(0, "rgba(0,0,0,.95)");
        f.addColorStop(0.55, "rgba(0,0,0,.55)");
        f.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = f;
        ctx.fillRect(0, 0, bx + bw * 0.16, H);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = clamp(y / (window.innerHeight * screens), 0, 1);
      bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
      if (header) {
        header.classList.toggle("am-hdr-on", y > 20);
        header.classList.toggle("am-hdr-hide", y > lastY && y > 400);
      }
      lastY = y;
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };

    // Transiciones de entrada para textos y tarjetas de la página
    const html = document.documentElement;
    html.classList.add("am-js");
    const revealed: HTMLElement[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).setAttribute("data-am-in", "");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
      if (el.closest('[class*="am-float"]')) return; // no tocar lo que ya flota
      if (el.parentElement?.closest("[data-am]")) return; // solo el elemento exterior
      const idx = Array.from(el.parentElement?.children ?? []).indexOf(el);
      el.style.setProperty("--d", String(Math.min(Math.max(idx, 0), 6)));
      el.setAttribute("data-am", el.matches(".am-card-3d") ? "zoom" : "up");
      revealed.push(el);
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) {
        el.setAttribute("data-am-in", "");
      } else {
        io.observe(el);
      }
    });

    img.onload = build;
    img.src = src;
    size();
    onScroll();
    window.addEventListener("resize", size);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      html.classList.remove("am-js");
      revealed.forEach((el) => {
        el.removeAttribute("data-am");
        el.removeAttribute("data-am-in");
        el.style.removeProperty("--d");
      });
      window.removeEventListener("resize", size);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      header?.classList.remove("am-hdr-on", "am-hdr-hide");
    };
  }, [src, screens]);

  return (
    <>
      <div ref={barRef} className="am-prog" aria-hidden />
      <canvas ref={canvasRef} className="am-car" aria-hidden />
    </>
  );
}
