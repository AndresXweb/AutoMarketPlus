import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, RefreshCw, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile } from "@/lib/market";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/destacados", label: "Destacados" },
  { to: "/contacto", label: "Contacto" },
];

function AuthSlot({ isAdmin }: { isAdmin: boolean }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-11 w-24 animate-pulse rounded-md bg-elevated" />;
  }
  if (!user) {
    return (
      <Link to="/login">
        <Button size="sm">Entrar</Button>
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link to="/admin" className="hidden sm:block">
          <Button variant="ghost" size="sm">
            Admin
          </Button>
        </Link>
      )}
      <UserButton />
    </div>
  );
}

function Mark() {
  return (
    <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-fg">
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
        <path d="M5 17a2 2 0 1 0 4 0H5Zm10 0a2 2 0 1 0 4 0h-4ZM4.2 11l1.4-4.2A2 2 0 0 1 7.5 5.5h9a2 2 0 0 1 1.9 1.3L20 11H4.2ZM3 12h18v3.5a1.5 1.5 0 0 1-1.5 1.5H19a3 3 0 0 0-6 0H11a3 3 0 0 0-6 0H4.5A1.5 1.5 0 0 1 3 15.5V12Z" />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isPending || !user) {
      setIsAdmin(false);
      return;
    }
    getMyProfile()
      .then((p) => setIsAdmin(p?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [user, isPending]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Mark />
          <span className="font-display text-lg font-semibold tracking-tight">AutoMarket</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(l.to) ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              {l.label}
            </Link>
          ))}
          <SignedIn>
            <Link
              to="/mis-anuncios"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith("/mis-anuncios") ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              Mis anuncios
            </Link>
            <Link
              to="/solicitudes"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith("/solicitudes") ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              Solicitudes
            </Link>
            <Link
              to="/ofertas"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith("/ofertas") ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              Ofertas
            </Link>
            <Link
              to="/favoritos"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith("/favoritos") ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              Favoritos
            </Link>
            <Link
              to="/perfil"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith("/perfil") ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              Perfil
            </Link>
          </SignedIn>
          <Link to="/publicar">
            <Button size="sm" variant="secondary">
              Publicar
            </Button>
          </Link>
          <AuthSlot isAdmin={isAdmin} />
        </nav>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-md border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <div className="grid gap-1">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                {l.label}
              </Link>
            ))}
            <Link to="/publicar" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
              Publicar anuncio
            </Link>
            <SignedIn>
              <Link to="/mis-anuncios" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                Mis anuncios
              </Link>
              <Link to="/solicitudes" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                Solicitudes de búsqueda
              </Link>
              <Link to="/ofertas" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                Ofertas
              </Link>
              <Link to="/favoritos" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                Favoritos
              </Link>
              <Link to="/perfil" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                Perfil
              </Link>
              {isAdmin && (
                <Link to="/admin" className="rounded-md px-3 py-3 text-sm text-fg hover:bg-elevated">
                  Administración
                </Link>
              )}
            </SignedIn>
            <SignedOut>
              <Link to="/login" className="mt-2">
                <Button className="w-full">Entrar</Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mark />
            <p className="font-display text-lg font-semibold">AutoMarket</p>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Marketplace directo entre personas. Publica, oferta o permuta sin
            intermediarios ruidosos.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div className="grid gap-2">
            <p className="font-medium text-fg">Mercado</p>
            <Link to="/catalogo" className="text-muted hover:text-fg">
              Catálogo
            </Link>
            <Link to="/destacados" className="text-muted hover:text-fg">
              Destacados
            </Link>
            <Link to="/solicitudes" className="text-muted hover:text-fg">
              Solicitud de búsqueda
            </Link>
            <Link to="/publicar" className="text-muted hover:text-fg">
              Publicar
            </Link>
            <Link to="/contacto" className="text-muted hover:text-fg">
              Contacto
            </Link>
          </div>
          <div className="grid gap-2">
            <p className="font-medium text-fg">Cuenta</p>
            <Link to="/login" className="text-muted hover:text-fg">
              Entrar
            </Link>
            <Link to="/favoritos" className="text-muted hover:text-fg">
              Favoritos
            </Link>
            <Link to="/terminos" className="text-muted hover:text-fg">
              Términos
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-border py-4 text-xs text-subtle">
        <span className="inline-flex items-center gap-1">
          <Tag className="size-3.5" /> Compra
        </span>
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="size-3.5" /> Permuta
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" /> Directo
        </span>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
