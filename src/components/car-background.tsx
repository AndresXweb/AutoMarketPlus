import { useEffect, useRef } from "react";

type Tile = {
  x: number; y: number; w: number; h: number;
  u: number; v: number;
  dl: number;
  vx: number; vy: number; r: number; z: number;
};

const TS = 32;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

// AJUSTE 1: luminancia (0-255) por debajo de la cual un pixel conectado al borde
// se considera fondo. Si todavia se ve fondo alrededor del logo, subelo (110, 130).
// Si se come partes oscuras del logo, bajalo (70, 55).
const BG_LUM = 90;

// AJUSTE 2: ancho del difuminado en los bordes de la imagen (fraccion, 0.03 = 3%).
const EDGE_FEATHER = 0.03;

function featherSides(img: HTMLImageElement): HTMLCanvasElement {
  const sc = Math.min(1, 1280 / img.naturalWidth);
  const w = Math.round(img.naturalWidth * sc);
  const h = Math.round(img.naturalHeight * sc);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  if (!x) return c;
  x.drawImage(img, 0, 0, w, h);
  x.globalCompositeOperation = "destination-in";
  const g = x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.06, "rgba(0,0,0,1)");
  g.addColorStop(0.94, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  return c;
}

const REVEAL =
  ".am-car ~ * :is(h1, h2, .am-card-3d, a:has(> button))";

/**
 * Quita el fondo oscuro del JPG (solo el conectado a los bordes) y difumina los bordes,
 * para que se vea unicamente el logo, sin rectangulo.
 */
function removeBackground(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return c;
  x.drawImage(img, 0, 0);

  let im: ImageData;
  try {
    im = x.getImageData(0, 0, w, h);
  } catch {
    return c;
  }
  const d = im.data;

  // Si el archivo ya trae transparencia (PNG), no se toca.
  if (d[3] < 250) return c;

  const lumAt = (p: number) => {
    const i = p * 4;
    return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  };

  const bg = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (p: number) => {
    if (bg[p] || lumAt(p) >= BG_LUM) return;
    bg[p] = 1;
    stack.push(p);
  };

  for (let i = 0; i < w; i++) {
    push(i);
    push((h - 1) * w + i);
  }
  for (let j = 0; j < h; j++) {
    push(j * w);
    push(j * w + w - 1);
  }
  while (stack.length) {
    const p = stack.pop() as number;
    const px = p % w;
    if (px > 0) push(p - 1);
    if (px < w - 1) push(p + 1);
    if (p >= w) push(p - w);
    if (p < w * (h - 1)) push(p + w);
  }

  // Pixeles de fondo -> transparentes (con transicion suave cerca del logo)
  for (let p = 0; p < w * h; p++) {
    if (!bg[p]) continue;
    const t = clamp((lumAt(p) - BG_LUM * 0.6) / (BG_LUM * 0.4), 0, 1);
    d[p * 4 + 3] = Math.round(ease(t) * 255);
  }
  x.putImageData(im, 0, 0);

  // Difuminado de los 4 bordes para que no quede ningun corte duro
  x.globalCompositeOperation = "destination-in";
  const fx = Math.max(2, w * EDGE_FEATHER);
  const fy = Math.max(2, h * EDGE_FEATHER);

  const gh = x.createLinearGradient(0, 0, w, 0);
  gh.addColorStop(0, "rgba(0,0,0,0)");
  gh.addColorStop(fx / w, "rgba(0,0,0,1)");
  gh.addColorStop(1 - fx / w, "rgba(0,0,0,1)");
  gh.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = gh;
  x.fillRect(0, 0, w, h);

  const gv = x.createLinearGradient(0, 0, 0, h);
  gv.addColorStop(0, "rgba(0,0,0,0)");
  gv.addColorStop(fy / h, "rgba(0,0,0,1)");
  gv.addColorStop(1 - fy / h, "rgba(0,0,0,1)");
  gv.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = gv;
  x.fillRect(0, 0, w, h);

  x.globalCompositeOperation = "source-over";
  return c;
}

/**
 * Logo centrado de fondo: al bajar se desarma en particulas; al subir se arma.
 */
export function CarBackground({
  src = "/hero-bg.jpg",
  screens = 1.6,
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
    let sprite: HTMLImageElement | HTMLCanvasElement = img;
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
      const scale = Math.max(W / IW, H / IH) * 0.80; // tamaño del fondo: 0.82 (más chico = número menor)
      bw = IW * scale;
      bh = IH * scale;
      bx = (W - bw) / 2;
      by = H - bh;
    };

    const build = () => {
      sprite = featherSides(img);
      IW = sprite.width;
      IH = sprite.height;
      const o = document.createElement("canvas");
      o.width = IW;
      o.height = IH;
      const c = o.getContext("2d", { willReadFrequently: true });
      if (!c) return;
      c.drawImage(sprite, 0, 0);
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
            dl: Math.random() * 0.26 + Math.abs(0.5 - x / IW) * 0.12,
            vx: Math.cos(a) * s * 640,
            vy: Math.sin(a) * s * 480 - 180,
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const p = cur, k = bw / IW, ox = cmx * -18, oy = cmy * -10;
      const now = performance.now() * 0.001;

      // Transparencia para que el texto se lea encima
      const baseAlpha = 1;
      if (p < 0.0015) {
        ctx.save();
        ctx.globalAlpha = baseAlpha;
        ctx.drawImage(sprite, bx + ox, by + oy, bw, bh);
        ctx.restore();
      } else {
        for (let i = 0; i < tiles.length; i++) {
          const q = tiles[i];
          const l = ease(clamp((p - q.dl * 0.9) / 0.6, 0, 1));
          const al = (1 - l * 0.9) * baseAlpha;
          if (al < 0.02) continue;
          const X = bx + q.u * bw + ox + q.vx * l * (0.55 + q.z);
          const Y = by + q.v * bh + oy + q.vy * l * (0.55 + q.z) - l * l * 160 * q.z + Math.sin(now + i) * l * 8;
          const sc = 1 - l * 0.45;
          const dw = q.w * k * sc + 0.7;
          const dh = q.h * k * sc + 0.7;
          const cs = Math.cos(q.r * l), sn = Math.sin(q.r * l);
          ctx.setTransform(cs * dpr, sn * dpr, -sn * dpr, cs * dpr, X * dpr, Y * dpr);
          ctx.globalAlpha = al;
          ctx.drawImage(sprite, q.x, q.y, q.w, q.h, -dw / 2, -dh / 2, dw, dh);
        }
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
      if (el.closest('[class*="am-float"]')) return;
      if (el.parentElement?.closest("[data-am]")) return;
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

    const safety = window.setTimeout(() => {
      document.querySelectorAll("[data-am]:not([data-am-in])").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.setAttribute("data-am-in", "");
      });
    }, 2000);

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
      window.clearTimeout(safety);
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
