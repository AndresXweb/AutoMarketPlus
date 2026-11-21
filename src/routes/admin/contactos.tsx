import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HoloActivity, HoloDonut, HoloPage, HoloPanel, HoloStat } from "@/components/holo-dashboard";
import { Button } from "@/components/ui/button";
import { bucketByDay } from "@/lib/holo-stats";
import { adminDeleteContact, adminListContacts, type ContactRow } from "@/lib/market";

export const Route = createFileRoute("/admin/contactos")({ component: ContactosAdmin });

const DAY_MS = 24 * 60 * 60 * 1000;

function ContactosAdmin() {
  const [rows, setRows] = useState<ContactRow[]>([]);

  async function reload() {
    setRows(await adminListContacts());
  }

  useEffect(() => {
    reload().catch(() => setRows([]));
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const time = (c: ContactRow) => new Date(c.createdAt).getTime();
    const registered = rows.filter((c) => c.userId).length;
    return {
      week: rows.filter((c) => now - time(c) <= 7 * DAY_MS).length,
      today: rows.filter((c) => time(c) >= startOfToday.getTime()).length,
      registered,
      visitors: rows.length - registered,
      activity: bucketByDay(rows.map((c) => c.createdAt)),
    };
  }, [rows]);

  return (
    <HoloPage title="Contactos" subtitle={`${rows.length} mensajes recibidos.`}>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HoloStat label="Mensajes" value={rows.length} />
        <HoloStat label="Últimos 7 días" value={stats.week} />
        <HoloStat label="Hoy" value={stats.today} alert={stats.today > 0} />
        <HoloStat label="De usuarios registrados" value={stats.registered} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <HoloPanel title="Mensajes · últimos 14 días" subtitle="Contactos recibidos por día" className="lg:col-span-2">
          <HoloActivity
            data={stats.activity}
            series={[{ key: "listings", legend: "Mensajes recibidos", tip: "Mensajes" }]}
            ariaLabel="Mensajes de contacto de los últimos 14 días"
          />
        </HoloPanel>
        <HoloPanel title="Origen" subtitle="Registrados o visitantes">
          <HoloDonut
            data={[
              { name: "Registrados", value: stats.registered },
              { name: "Visitantes", value: stats.visitors },
            ].filter((d) => d.value > 0)}
          />
        </HoloPanel>
      </div>

      <ul className="mt-6 grid gap-3">
        {rows.length === 0 && <li className="text-sm text-muted">No hay mensajes todavía.</li>}
        {rows.map((c) => (
          <li key={c.id} className="holo-row p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="holo-avatar size-10 shrink-0 text-sm">
                  {(c.name || "?").trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    <span className="text-xs tabular-nums text-subtle">
                      {new Date(c.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-sm text-muted">
                    {c.email} · {c.phone}
                  </p>
                  {c.subject && <p className="mt-1 text-sm text-fg">{c.subject}</p>}
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.message}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void adminDeleteContact({ data: { id: c.id } }).then(reload)}>
                Borrar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </HoloPage>
  );
}
