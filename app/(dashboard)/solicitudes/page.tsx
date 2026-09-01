import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile, ZENZIA_ADMIN_COMPANY_ID } from "@/lib/company";
import { reviewSignupRequest } from "@/lib/actions/signupRequests";
import { PageHeader, Card, Badge, GhostButton, PrimaryButton } from "@/components/ui";
import { VERTICAL_CATALOG } from "@/lib/verticals";

const PLAN_LABEL: Record<string, string> = { mensual: "Mensual", anual: "Anual" };
const USAGE_LABEL: Record<string, string> = { negocio: "Uso de negocio", personal: "Uso personal" };
const STATUS_TONE: Record<string, "neutral" | "green" | "amber" | "red"> = {
  pendiente: "amber",
  aprobada: "green",
  denegada: "red",
};
const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  denegada: "Denegada",
};

function verticalLabel(key: string | null) {
  if (!key) return null;
  return VERTICAL_CATALOG.find((v) => v.key === key)?.label ?? key;
}

// Solo visible para RL Digital Studios (el dueño de Zenzia) — cualquier
// otra empresa que use el CRM ni siquiera debería llegar a esta URL; si lo
// intenta, la mandamos de vuelta al dashboard (la RLS de Supabase ya le
// bloquea los datos igualmente, esto es solo para que no vea una pantalla
// vacía sin sentido).
export default async function SolicitudesPage() {
  const profile = await getCurrentCompanyProfile();
  if (profile.companyId !== ZENZIA_ADMIN_COMPANY_ID) redirect("/dashboard");

  const supabase = createClient();
  const { data: requests } = await supabase
    .from("signup_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const pendientes = (requests ?? []).filter((r: any) => r.status === "pendiente");
  const resueltas = (requests ?? []).filter((r: any) => r.status !== "pendiente");

  return (
    <div>
      <PageHeader
        eyebrow={pendientes.length > 0 ? `${pendientes.length} pendientes` : "Al día"}
        title="Solicitudes de registro"
      />

      <div className="space-y-4">
        {pendientes.map((r: any) => (
          <SolicitudCard key={r.id} r={r} />
        ))}
        {pendientes.length === 0 && (
          <Card>
            <span className="text-slate/70">No hay solicitudes pendientes.</span>
          </Card>
        )}
      </div>

      {resueltas.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Resueltas</h2>
          <div className="space-y-3">
            {resueltas.map((r: any) => (
              <SolicitudCard key={r.id} r={r} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SolicitudCard({ r, compact = false }: { r: any; compact?: boolean }) {
  const aprobar = reviewSignupRequest.bind(null, r.id, "aprobada");
  const denegar = reviewSignupRequest.bind(null, r.id, "denegada");
  const vertical = verticalLabel(r.vertical);

  return (
    <Card className={compact ? "opacity-80" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{r.business_name}</span>
            <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
          </div>
          <div className="mt-1 text-sm text-slate">
            <span className="text-ink">{r.manager_name}</span>
            {" · "}
            <a href={`mailto:${r.email}`} className="hover:underline">
              {r.email}
            </a>
            {" · "}
            <a href={`tel:${r.phone}`} className="hover:underline">
              {r.phone}
            </a>
          </div>
          <div className="mt-2 text-sm text-slate">
            <span className="text-ink">Ofrece:</span> {r.service_offered}
            {vertical && (
              <>
                {" · "}
                <span className="text-ink">Sector:</span> {vertical}
              </>
            )}
          </div>
          <div className="mt-1 text-sm text-slate">
            <span className="text-ink">Plan:</span> {PLAN_LABEL[r.plan] ?? r.plan}
            {" · "}
            <span className="text-ink">Tipo:</span> {USAGE_LABEL[r.usage_type] ?? r.usage_type}
          </div>
          {r.message && <div className="mt-2 text-sm italic text-slate">"{r.message}"</div>}
          <div className="mt-2 text-xs text-slate/60">
            {new Date(r.created_at).toLocaleString("es-ES")}
          </div>
        </div>

        {r.status === "pendiente" && (
          <div className="flex shrink-0 gap-2">
            <form action={aprobar}>
              <PrimaryButton className="px-3 py-1.5 text-xs">Aprobar</PrimaryButton>
            </form>
            <form action={denegar}>
              <GhostButton>Denegar</GhostButton>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
}
