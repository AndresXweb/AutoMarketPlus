import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/recuperar")({ component: Recuperar });

function Recuperar() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(te);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/restablecer`
          : "/restablecer";

      // Better Auth: forgetPassword o requestPasswordReset según versión
      const client = authClient as typeof authClient & {
        forgetPassword?: (args: { email: string; redirectTo: string }) => Promise<{ error?: { message?: string } | null }>;
        requestPasswordReset?: (args: { email: string; redirectTo: string }) => Promise<{ error?: { message?: string } | null }>;
      };

      let res: { error?: { message?: string } | null } | undefined;
      if (typeof client.requestPasswordReset === "function") {
        res = await client.requestPasswordReset({ email, redirectTo });
      } else if (typeof client.forgetPassword === "function") {
        res = await client.forgetPassword({ email, redirectTo });
      } else {
        console.error("[recuperar] El cliente auth no expone forgetPassword/requestPasswordReset");
        toast.error("Esta versión de auth no soporta recuperar contraseña. Revisa better-auth.");
        return;
      }

      if (res?.error) {
        console.error("[recuperar] error API:", res.error);
        // Mensaje genérico al usuario; detalle en consola del navegador
      }

      setSent(true);
      toast.success("Si el correo está registrado, te enviamos instrucciones.");
    } catch (err) {
      console.error("[recuperar]", err);
      setSent(true);
      toast.success("Si el correo está registrado, te enviamos instrucciones.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Cuenta</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-muted">
          Te enviaremos un enlace a tu correo para elegir una contraseña nueva.
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-sm leading-relaxed">
              Si <strong>{email}</strong> está registrado, deberías recibir un correo en unos
              minutos. Revisa también <strong>spam</strong>.
            </p>

            <Link to="/login" className="mt-4 inline-block text-sm text-accent">
              Volver a entrar
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-4">
            <Field label="Correo de la cuenta">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "Enviando…" : "Enviar enlace"}
            </Button>
            <Link to="/login" className="text-center text-sm text-muted">
              Volver
            </Link>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
