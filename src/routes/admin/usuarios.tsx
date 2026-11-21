import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { HoloActivity, HoloBars, HoloDonut, HoloPage, HoloPanel, HoloStat } from "@/components/holo-dashboard";
import { VerifiedBadge } from "@/components/verified-badge";
import { bucketByDay, countBy } from "@/lib/holo-stats";
import { CITIES, DOC_TYPES, STATUS_LABEL } from "@/lib/format";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminSetAccountStatus,
  adminSetRole,
  adminUpdateUser,
  type Profile,
} from "@/lib/market";

export const Route = createFileRoute("/admin/usuarios")({ component: Usuarios });

const VERIF_LABEL: Record<string, string> = {
  verificado: "Verificado",
  pendiente: "Pendiente",
  rechazado: "Rechazado",
  ninguno: "Sin verificar",
};

function Usuarios() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setRows(await adminListUsers());
  }

  useEffect(() => {
    reload().catch(() => setRows([]));
  }, []);

  const stats = useMemo(() => {
    const verified = rows.filter((u) => u.verificationStatus === "verificado").length;
    const admins = rows.filter((u) => u.role === "admin").length;
    const disabled = rows.filter((u) => u.accountStatus === "deshabilitado").length;
    return {
      verified,
      admins,
      disabled,
      verification: countBy(rows, (u) => u.verificationStatus).map(([k, v]) => ({
        name: VERIF_LABEL[k] ?? k,
        value: v,
      })),
      cities: countBy(rows, (u) => u.city ?? "Sin ciudad")
        .slice(0, 6)
        .map(([name, n]) => ({ name, n })),
      signups: bucketByDay(rows.map((u) => u.createdAt)),
    };
  }, [rows]);

  async function setRole(userId: string, role: "admin" | "cliente") {
    try {
      await adminSetRole({ data: { userId, role } });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el rol.");
    }
  }

  async function toggleStatus(u: Profile) {
    try {
      const next = u.accountStatus === "activo" ? "deshabilitado" : "activo";
      await adminSetAccountStatus({ data: { userId: u.userId, status: next } });
      toast.success(next === "activo" ? "Usuario habilitado." : "Usuario deshabilitado.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  async function remove(u: Profile) {
    if (!window.confirm(`¿Eliminar a ${u.displayName}? Se borran sus anuncios y ofertas.`)) return;
    try {
      await adminDeleteUser({ data: { userId: u.userId } });
      toast.success("Usuario eliminado.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  }

  async function save(e: FormEvent<HTMLFormElement>, userId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await adminUpdateUser({
        data: {
          userId,
          firstName: String(fd.get("firstName")),
          lastName: String(fd.get("lastName")),
          phone: String(fd.get("phone") || "") || undefined,
          whatsapp: String(fd.get("whatsapp") || "") || undefined,
          city: String(fd.get("city") || "") || undefined,
          address: String(fd.get("address") || "") || undefined,
          email: String(fd.get("email") || "") || undefined,
          documentType: (String(fd.get("documentType") || "") as "CC" | "CE" | "NIT" | "PA") || undefined,
          documentNumber: String(fd.get("documentNumber") || "") || undefined,
          role: String(fd.get("role")) as "admin" | "cliente",
        },
      });
      toast.success("Datos actualizados. La contraseña no se modifica desde aquí.");
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  return (
    <HoloPage
      title="Usuarios"
      subtitle={`${rows.length} perfiles. Puedes editar datos, deshabilitar o eliminar. La contraseña solo la cambia el titular.`}
      right={
        <Button size="sm" onClick={() => setCreating((c) => !c)}>
          {creating ? "Cerrar" : "Crear usuario"}
        </Button>
      }
    >
      {creating && (
        <form
          className="holo-panel holo-corners mt-6 grid gap-3 p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void adminCreateUser({
              data: {
                firstName: String(fd.get("firstName")),
                lastName: String(fd.get("lastName")),
                email: String(fd.get("email")),
                password: String(fd.get("password")),
                phone: String(fd.get("phone") || "") || undefined,
                city: String(fd.get("city") || "") || undefined,
                role: String(fd.get("role") || "cliente") as "admin" | "cliente",
              },
            })
              .then(() => {
                toast.success("Usuario creado.");
                setCreating(false);
                return reload();
              })
              .catch((err) =>
                toast.error(err instanceof Error ? err.message : "No se pudo crear."),
              );
          }}
        >
          <Field label="Nombres">
            <Input name="firstName" required minLength={2} />
          </Field>
          <Field label="Apellidos">
            <Input name="lastName" required minLength={2} />
          </Field>
          <Field label="Correo">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Contraseña temporal">
            <Input name="password" type="password" required minLength={8} />
          </Field>
          <Field label="Teléfono">
            <Input name="phone" />
          </Field>
          <Field label="Ciudad">
            <Select name="city" defaultValue="Bogotá">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Rol">
            <Select name="role" defaultValue="cliente">
              <option value="cliente">cliente</option>
              <option value="admin">admin</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">
              Crear usuario
            </Button>
          </div>
        </form>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HoloStat label="Usuarios" value={rows.length} />
        <HoloStat label="Verificados" value={stats.verified} />
        <HoloStat label="Administradores" value={stats.admins} />
        <HoloStat label="Deshabilitados" value={stats.disabled} alert={stats.disabled > 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <HoloPanel title="Registros · últimos 14 días" subtitle="Cuentas creadas por día" className="lg:col-span-2">
          <HoloActivity
            data={stats.signups}
            series={[{ key: "listings", legend: "Registros", tip: "Registros" }]}
            ariaLabel="Registros de usuarios de los últimos 14 días"
          />
        </HoloPanel>
        <HoloPanel title="Verificación" subtitle="Estado de identidad">
          <HoloDonut data={stats.verification} />
        </HoloPanel>
      </div>

      <HoloPanel title="Usuarios por ciudad" subtitle="Las ciudades con más cuentas" className="mt-6">
        <HoloBars data={stats.cities} />
      </HoloPanel>

      <div className="mt-6 grid gap-3">
        {rows.map((u) => (
          <article
            key={u.userId}
            className={`holo-row p-4 ${u.accountStatus === "deshabilitado" ? "holo-row-danger" : ""}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="holo-avatar size-10 shrink-0 text-sm">
                  {(u.displayName || "?").trim().charAt(0).toUpperCase()}
                </span>
                <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{u.displayName}</p>
                  {u.verificationStatus === "verificado" && <VerifiedBadge />}
                  <Badge tone={u.role === "admin" ? "accent" : "neutral"}>{u.role}</Badge>
                  <Badge tone={u.accountStatus === "deshabilitado" ? "danger" : "success"}>
                    {STATUS_LABEL[u.accountStatus] ?? u.accountStatus}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {u.email ?? "Sin correo"} · {u.city ?? "Sin ciudad"} · {u.phone ?? "Sin teléfono"}
                </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(editing === u.userId ? null : u.userId)}>
                  {editing === u.userId ? "Cerrar" : "Editar"}
                </Button>
                {u.role === "admin" ? (
                  <Button size="sm" variant="ghost" onClick={() => void setRole(u.userId, "cliente")}>
                    Quitar admin
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => void setRole(u.userId, "admin")}>
                    Hacer admin
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => void toggleStatus(u)}>
                  {u.accountStatus === "deshabilitado" ? "Habilitar" : "Deshabilitar"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => void remove(u)}>
                  Eliminar
                </Button>
              </div>
            </div>
            {editing === u.userId && (
              <form onSubmit={(e) => void save(e, u.userId)} className="mt-4 grid gap-3 border-t border-accent/20 pt-4 sm:grid-cols-2">
                <Field label="Nombres">
                  <Input name="firstName" defaultValue={u.firstName ?? u.displayName.split(" ")[0]} required />
                </Field>
                <Field label="Apellidos">
                  <Input name="lastName" defaultValue={u.lastName ?? u.displayName.split(" ").slice(1).join(" ")} required />
                </Field>
                <Field label="Correo">
                  <Input name="email" type="email" defaultValue={u.email ?? ""} />
                </Field>
                <Field label="Teléfono">
                  <Input name="phone" defaultValue={u.phone ?? ""} />
                </Field>
                <Field label="WhatsApp">
                  <Input name="whatsapp" defaultValue={u.whatsapp ?? ""} />
                </Field>
                <Field label="Ciudad">
                  <Select name="city" defaultValue={u.city ?? "Bogotá"}>
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Dirección">
                  <Input name="address" defaultValue={u.address ?? ""} />
                </Field>
                <Field label="Rol">
                  <Select name="role" defaultValue={u.role}>
                    <option value="cliente">cliente</option>
                    <option value="admin">admin</option>
                  </Select>
                </Field>
                <Field label="Documento">
                  <Select name="documentType" defaultValue={u.documentType ?? "CC"}>
                    {DOC_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Número">
                  <Input name="documentNumber" defaultValue={u.documentNumber ?? ""} />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" size="sm">
                    Guardar cambios
                  </Button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>
    </HoloPage>
  );
}
