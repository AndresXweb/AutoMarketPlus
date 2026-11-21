import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, Mail, Megaphone, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile } from "@/lib/market";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const NAV = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/verificaciones", label: "Verificaciones", icon: ShieldCheck },
  { to: "/admin/anuncios", label: "Anuncios", icon: Megaphone },
  { to: "/admin/ofertas", label: "Ofertas", icon: ClipboardList },
  { to: "/admin/contactos", label: "Contactos", icon: Mail },
];

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setAllowed(false);
      return;
    }
    getMyProfile()
      .then((p) => setAllowed(p?.role === "admin"))
      .catch(() => setAllowed(false));
  }, [user, isPending]);

  if (isPending || allowed === null) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">Cargando panel…</div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (!allowed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">Sin acceso</h1>
          <p className="mt-2 text-sm text-muted">Este panel es solo para administradores.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-accent">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-accent/20 bg-surface/70 backdrop-blur md:flex">
        <Link to="/" className="border-b border-accent/20 px-5 py-5">
          <p className="holo-title font-display text-lg font-semibold">AutoMarket</p>
          <p className="text-xs uppercase tracking-[0.2em] text-accent/70">Administración</p>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-sm transition-colors",
                  active ? "holo-nav-active" : "text-muted hover:border-accent/20 hover:bg-elevated/60 hover:text-fg",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-accent/15 bg-bg/60 px-4 backdrop-blur md:px-8">
          <div className="flex gap-2 overflow-x-auto md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 rounded-md border border-accent/30 px-3 py-2 text-xs"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link to="/" className="hidden text-sm text-muted hover:text-fg md:inline">
            Ver sitio
          </Link>
          <div className="ml-auto">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
