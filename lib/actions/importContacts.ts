"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { parseCsv } from "@/lib/csv";

// Columnas reconocidas (cabeceras en minúscula y sin acentos).
const FIELDS: Record<string, string[]> = {
  full_name: ["nombre", "nombre y apellidos", "nombre completo", "name", "cliente", "paciente"],
  phone: ["telefono", "movil", "tel", "phone", "celular"],
  email: ["email", "correo", "e-mail", "mail"],
  address: ["direccion", "domicilio", "address"],
  birth_date: ["fecha de nacimiento", "nacimiento", "fecha nacimiento", "birth date", "birthday"],
  tax_id: ["dni", "nif", "dni/nif", "documento"],
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function toIsoDate(v: string): string | null {
  const m = v.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? `19${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null;
}

// Importa pacientes/clientes desde un CSV (exportado de Excel u otro
// programa). Los importados no cuentan para el límite mensual del plan.
export async function importContacts(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) redirect("/contactos/importar?error=Elige un archivo CSV");
  const rows = parseCsv(await file!.text());
  if (rows.length < 2) redirect("/contactos/importar?error=El archivo está vacío");

  const header = rows[0].map(norm);
  const col = (key: string) => header.findIndex((h) => FIELDS[key].includes(h));
  const idx = Object.fromEntries(Object.keys(FIELDS).map((k) => [k, col(k)]));
  if (idx.full_name < 0) redirect("/contactos/importar?error=No encuentro la columna Nombre");

  const companyId = await getCurrentCompanyId();
  const get = (r: string[], k: string) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
  const records = rows
    .slice(1, 2001)
    .filter((r) => get(r, "full_name"))
    .map((r) => {
      const custom_fields: Record<string, unknown> = { imported: true };
      if (get(r, "address")) custom_fields.billing_address = get(r, "address");
      if (get(r, "tax_id")) custom_fields.tax_id = get(r, "tax_id");
      return {
        company_id: companyId,
        full_name: get(r, "full_name"),
        phone: get(r, "phone") || null,
        email: get(r, "email") || null,
        birth_date: toIsoDate(get(r, "birth_date")),
        status: "active",
        custom_fields,
      };
    });

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert(records);
  if (error) redirect(`/contactos/importar?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/contactos");
  redirect(`/contactos/importar?ok=${records.length}`);
}
