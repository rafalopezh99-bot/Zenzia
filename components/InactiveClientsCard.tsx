import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Pro: clientes que llevan más de 60 días sin venir, con WhatsApp directo
// para recuperarlos (además del email automático, ver /api/cron/automations).
export default async function InactiveClientsCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, full_name, phone, appointments(starts_at)")
    .eq("status", "active");

  const limit = Date.now() - 60 * 86400000;
  const inactive = (data ?? [])
    .map((c: any) => ({
      ...c,
      last: Math.max(0, ...(c.appointments ?? []).map((a: any) => new Date(a.starts_at).getTime())),
    }))
    .filter((c) => c.last > 0 && c.last < limit)
    .sort((a, b) => a.last - b.last)
    .slice(0, 5);

  if (!inactive.length) return null;

  return (
    <div className="mb-8 rounded-2xl border border-line bg-surface p-5 sm:max-w-4xl">
      <div className="mb-3 text-sm font-semibold text-ink">Clientes que llevan tiempo sin venir</div>
      <ul className="space-y-2 text-sm">
        {inactive.map((c) => {
          const days = Math.floor((Date.now() - c.last) / 86400000);
          const wa = (c.phone ?? "").replace(/\D/g, "");
          return (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <Link href={`/contactos/${c.id}`} className="text-ink hover:text-brand">
                {c.full_name} <span className="text-xs text-slate">· hace {days} días</span>
              </Link>
              {wa && (
                <a
                  href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${c.full_name}, ¡hace tiempo que no te vemos! ¿Te reservo una cita?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#128C7E] hover:underline"
                >
                  WhatsApp
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
