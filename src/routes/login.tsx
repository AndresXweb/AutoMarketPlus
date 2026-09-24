import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { CITIES, DOC_TYPES } from "@/lib/format";
import { getMyProfile } from "@/lib/market";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: Login });

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/** Recarga completa para que la cookie de sesión se refleje en el navbar. */
async function goAfterLogin() {
  try {
    const profile = await getMyProfile();
    const incomplete = !profile?.phone || String(profile.phone).replace(/\D/g, "").length < 7;
    window.location.href = incomplete ? "/perfil?completar=1" : "/";
  } catch {
    window.location.href = "/perfil?completar=1";
  }
}

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState(CITIES[0] ?? "Bogotá");
  const [address, setAddress] = useState("");
  const [documentType, setDocumentType] = useState<(typeof DOC_TYPES)[number]>("CC");
  const [documentNumber, setDocumentNumber] = useState("");
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const existing = document.querySelector("script[data-google-gsi]");
    if (existing) {
      setGoogleReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.dataset.googleGsi = "1";
    s.onload = () => setGoogleReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID || !window.google) return;
    const el = document.getElementById("google-btn-slot");
    if (!el) return;
    el.innerHTML = "";
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return;
          if (mode === "crear" && !aceptoTerminos) {
            toast.error("Debes aceptar los términos para registrarte con Google.");
            return;
          }
          setBusy(true);
          setError(null);
          try {
            const res = await authClient.signIn.social({
              provider: "google",
              idToken: { token: response.credential },
            });
            if (res.error) {
              setError(res.error.message ?? "No se pudo entrar con Google.");
              return;
            }
            toast.success("Sesión iniciada con Google.");
            await goAfterLogin();
            return;
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error con Google.");
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        width: 320,
        text: mode === "crear" ? "signup_with" : "signin_with",
        locale: "es",
      });
    } catch {
      /* GSI no disponible */
    }
  }, [googleReady, mode, aceptoTerminos, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "crear") {
        if (!aceptoTerminos) {
          setError("Debes aceptar los términos y condiciones.");
          return;
        }
        const name = `${firstName} ${lastName}`.trim();
        const res = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (res.error) {
          setError(res.error.message ?? "No se pudo crear la cuenta.");
          return;
        }
        toast.success(
          "Cuenta creada. Revisa tu correo para confirmarla antes de publicar u ofertar.",
        );
        setMode("entrar");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          setError(res.error.message ?? "Correo o contraseña incorrectos.");
          return;
        }
        toast.success("Bienvenido.");
        await goAfterLogin();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Cuenta</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">
          {mode === "crear" ? "Crear cuenta" : "Entrar"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "crear"
            ? "Te enviaremos un correo para confirmar tu cuenta. Sin eso no podrás publicar ni ofertar."
            : "Correo y contraseña, o Google."}
        </p>

        <div className="mt-6 flex rounded-lg bg-surface p-1">
          {(["entrar", "crear"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium",
                mode === m ? "bg-elevated text-fg" : "text-muted",
              )}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
            >
              {m === "entrar" ? "Entrar" : "Crear cuenta"}
            </button>
          ))}
        </div>

        {authEnabled && GOOGLE_CLIENT_ID && (
          <div className="mt-6 space-y-2">
            {mode === "crear" && (
              <label className="flex items-start gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={aceptoTerminos}
                  onChange={(e) => setAceptoTerminos(e.target.checked)}
                />
                <span>
                  Acepto los{" "}
                  <Link to="/terminos" className="text-accent underline">
                    términos
                  </Link>{" "}
                  para registrarme con Google.
                </span>
              </label>
            )}
            <div id="google-btn-slot" className="flex justify-center" />
            {!googleReady && <p className="text-center text-xs text-subtle">Cargando Google…</p>}
          </div>
        )}

        {authEnabled && !GOOGLE_CLIENT_ID && GROK_PROVIDERS.length > 0 && (
          <div className="mt-6 grid gap-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continuar con {p.label} (broker)
              </Button>
            ))}
            <p className="text-xs text-subtle">
              Para Google en localhost configura VITE_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
            </p>
          </div>
        )}

        <div className="my-6 flex items-center gap-3 text-xs text-subtle">
          <div className="h-px flex-1 bg-border" />
          o con correo
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          {mode === "crear" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombres">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Apellidos">
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de documento">
                  <Select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
                  >
                    {DOC_TYPES.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Número">
                  <Input
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Teléfono">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    minLength={7}
                    autoComplete="tel"
                  />
                </Field>
                <Field label="WhatsApp">
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Si es distinto al teléfono"
                  />
                </Field>
              </div>
              <Field label="Ciudad">
                <Select value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Dirección">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Barrio y dirección"
                  autoComplete="street-address"
                />
              </Field>
              <label className="flex items-start gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={aceptoTerminos}
                  onChange={(e) => setAceptoTerminos(e.target.checked)}
                  required
                />
                <span>
                  Acepto los{" "}
                  <Link to="/terminos" className="text-accent underline">
                    términos y condiciones
                  </Link>
                  .
                </span>
              </label>
            </>
          )}
          <Field label="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "crear" ? "new-password" : "current-password"}
            />
          </Field>
          {mode === "entrar" && (
            <p className="text-sm">
              <Link to="/recuperar" className="text-accent underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Espera…" : mode === "crear" ? "Crear cuenta" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-subtle">
          Debes confirmar el correo para publicar u ofertar. La verificación de cédula es
          adicional y la revisa un administrador.
        </p>
      </main>
    </SiteShell>
  );
}
