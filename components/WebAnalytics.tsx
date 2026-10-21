import InfoTip from "@/components/InfoTip";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

// Dashboard del plan Web: visitas y clics de la web del cliente (tabla
// web_events, la rellena el script de su web). Últimos 30 días.
const DAY = 86400000;

type WebLink = { id: string; label: string; url: string };

export default async function WebAnalytics({
  siteUrl,
  fullName,
  webLinks = [],
}: {
  siteUrl: string | null;
  fullName?: string | null;
  webLinks?: WebLink[];
}) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * DAY);
  const { data } = await supabase
    .from("web_events")
    .select("type, label, referrer, device, session_id, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(20000);
  const ev = (data ?? []) as { type: string; label: string | null; referrer: string | null; device: string | null; session_id: string | null; created_at: string }[];

  const views = ev.filter((e) => e.type === "view");
  const clicks = ev.filter((e) => e.type === "click");
  const now = Date.now();
  const inDays = (e: { created_at: string }, d: number) => now - new Date(e.created_at).getTime() < d * DAY;
  const visitors = new Set(views.map((v) => v.session_id)).size;
  const mobile = views.filter((v) => v.device === "movil").length;

  const count = (list: string[]) => {
    const m = new Map<string, number>();
    list.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const topClicks = count(clicks.map((c) => c.label || "Enlace")).slice(0, 8);
  const sources = count(
    views.map((v) => {
      const r = v.referrer || "";
      if (!r) return "Directo";
      if (/google\./i.test(r)) return "Google";
      if (/instagram/i.test(r)) return "Instagram";
      if (/facebook|fb\./i.test(r)) return "Facebook";
      if (/tiktok/i.test(r)) return "TikTok";
      try {
        return new URL(r).hostname.replace(/^www\./, "");
      } catch {
        return "Otros";
      }
    })
  ).slice(0, 6);

  // Visitas por día (últimos 14 días).
  const days = Array.from({ length: 14 }, (_, i) => new Date(now - (13 - i) * DAY));
  const key = (d: Date) => d.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" });
  const perDay = days.map((d) => views.filter((v) => key(new Date(v.created_at)) === key(d)).length);
  const maxDay = Math.max(1, ...perDay);

  const kpi = (label: string, value: string | number, hint: string | undefined, info: string) => (
    <Card className="relative">
      <div className="absolute left-3 top-3">
        <InfoTip text={info} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-ink">{value}</div>
      <div className="text-sm text-slate">{label}</div>
      {hint && <div className="mt-1 text-xs text-slate/70">{hint}</div>}
    </Card>
  );
  const bars = (rows: [string, number][], empty: string) => {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return rows.length ? (
      <ul className="space-y-3 text-sm">
        {rows.map(([name, n]) => (
          <li key={name}>
            <div className="flex justify-between">
              <span className="truncate text-ink">{name}</span>
              <span className="font-semibold text-ink">{n}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-paper-deep">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-slate">{empty}</p>
    );
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-3xl">{fullName ? `¡Hola, ${fullName}!` : "¡Hola!"}</h1>
          <p className="text-sm text-slate">Así va tu web</p>
        </div>
        {siteUrl && (
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline">
            {siteUrl.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
      </div>
      {webLinks.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {webLinks.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">Últimos 30 días</p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi(
          "Visitas",
          views.length,
          `${views.filter((v) => inDays(v, 7)).length} esta semana · ${views.filter((v) => inDays(v, 1)).length} hoy`,
          "Veces que se ha abierto tu web en los últimos 30 días. Si alguien entra varias veces, cuenta cada vez."
        )}
        {kpi("Visitantes", visitors, undefined, "Personas distintas que han entrado (aproximado: cada visita desde un navegador nuevo cuenta como una persona).")}
        {kpi(
          "Clics en enlaces",
          clicks.length,
          `${clicks.filter((c) => inDays(c, 7)).length} esta semana`,
          "Veces que alguien ha pulsado un enlace de tu web: WhatsApp, email, redes sociales, botones a otras páginas…"
        )}
        {kpi(
          "Desde el móvil",
          views.length ? `${Math.round((mobile / views.length) * 100)} %` : "—",
          undefined,
          "Porcentaje de visitas hechas desde un móvil. El resto son desde ordenador o tablet."
        )}
      </div>

      <Card className="mb-4">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate">
          <InfoTip text="Cuántas veces se abrió tu web cada día en las últimas dos semanas. Pasa el ratón por una barra para ver la fecha." />
          Visitas por día
        </h2>
        <div className="flex h-36 items-end gap-1.5">
          {perDay.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${key(days[i])}: ${n}`}>
              <span className="text-[10px] text-slate">{n || ""}</span>
              {/* Pista de altura fija: un % de altura en CSS solo funciona si el
                  padre tiene una altura concreta — sin esto, el div de arriba
                  (sin h-*) hacía que la barra cayera siempre al minHeight de
                  respaldo, da igual cuántas visitas hubiera ese día. */}
              <div className="flex h-24 w-full flex-col justify-end">
                <div className="w-full rounded-t bg-brand" style={{ height: `${(n / maxDay) * 100}%`, minHeight: 3 }} />
              </div>
              <span className="text-[10px] text-slate">{days[i].getDate()}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate">
            <InfoTip text="Los enlaces y botones que más pulsan tus visitantes. Te dice cómo prefieren contactarte." />
            Qué pulsan
          </h2>
          {bars(topClicks, "Todavía no hay clics registrados.")}
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate">
            <InfoTip text="Desde dónde entran a tu web. «Directo» es quien escribe la dirección, usa un favorito o pulsa un enlace desde WhatsApp." />
            De dónde llegan
          </h2>
          {bars(sources, "Todavía no hay visitas registradas.")}
        </Card>
      </div>
      <p className="mt-4 text-xs text-slate/70">Las visitas que haces tú desde Zenzia (vista previa y edición) no cuentan.</p>
    </div>
  );
}
