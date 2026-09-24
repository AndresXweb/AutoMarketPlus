import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/restablecer")({ component: Restablecer });

function Restablecer() {
  const navigate = useNavigate();
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Enlace inválido o incompleto. Solicita uno nuevo.");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (res.error) {
        toast.error(res.error.message ?? "No se pudo restablecer. Solicita un enlace nuevo.");
        return;
      }
      toast.success("Contraseña actualizada. Ya puedes entrar.");
      void navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo restablecer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Cuenta</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-muted">Elige una contraseña segura para tu cuenta.</p>

        {!token ? (
          <p className="mt-8 text-sm text-danger">
            Falta el token en el enlace.{" "}
            <Link to="/recuperar" className="text-accent underline">
              Solicitar de nuevo
            </Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-4">
            <Field label="Nueva contraseña">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
