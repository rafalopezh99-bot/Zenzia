import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, primaryButtonClass } from "@/components/ui";
import ContactarClienteButton from "@/components/ContactarClienteButton";

// Lista de clientes potenciales que Rafa añade a mano (nombre + email o
// Instagram, tipo y nombre del negocio, qué servicio ofrecerle). Distinta
// de /contactos (gente ya contactada por cualquier vía) y de
// /notificaciones (leads que llegan solos por el formulario) — esta es su
// propia lista de prospección para hacer outreach.
export default async function ClientesPage() {
  const supabase = createClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, contact_name, email, instagram_handle, business_type, business_name, service_offer, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={
          <Link href="/clientes/nuevo" className={primaryButtonClass}>
            Nuevo cliente
          </Link>
        }
      />

      <div className="space-y-4">
        {(prospects ?? []).map((p: any) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{p.business_name || "Sin nombre de negocio"}</span>
                  <Badge tone={p.status === "contactado" ? "green" : "amber"}>
                    {p.status === "contactado" ? "Contactado" : "Nuevo"}
                  </Badge>
                </div>
                {p.business_type && <div className="text-xs text-slate/70">{p.business_type}</div>}
                <div className="mt-2 text-sm text-slate">
                  <span className="text-ink">{p.contact_name}</span>
                  {p.email && <span> · {p.email}</span>}
                  {p.instagram_handle && <span> · @{p.instagram_handle}</span>}
                </div>
                {p.service_offer && <div className="mt-1 text-sm text-slate">Ofrecerle: {p.service_offer}</div>}
              </div>
              <ContactarClienteButton
                id={p.id}
                contactName={p.contact_name}
                businessName={p.business_name ?? ""}
                businessType={p.business_type ?? ""}
                serviceOffer={p.service_offer ?? ""}
                alreadyContacted={p.status === "contactado"}
              />
            </div>
          </Card>
        ))}
        {(prospects ?? []).length === 0 && (
          <Card>
            <span className="text-slate/70">Todavía no has añadido ningún cliente potencial.</span>
          </Card>
        )}
      </div>
    </div>
  );
}
