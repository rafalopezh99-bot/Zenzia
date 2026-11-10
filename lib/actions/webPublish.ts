"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { buildSite } from "@/lib/web-publish/build";
import { deployToNetlify } from "@/lib/web-publish/netlify";
import { hasSiteSource } from "@/lib/web-publish/source";
import { revalidatePath } from "next/cache";

// «Publicar» en Mi web: genera la web con los cambios guardados y la sube a
// Netlify. La web pública queda como archivos estáticos: sin scripts de Zenzia,
// sin llamadas a Supabase y sin rastreo.
export async function publishWebsite(): Promise<{ ok: true; publishedAt: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const companyId = await getCurrentCompanyId();

    const { data: co, error: coErr } = await supabase.from("companies").select("netlify_site_id").eq("id", companyId).single();
    if (coErr) throw new Error(coErr.message);
    if (!co?.netlify_site_id || !(await hasSiteSource(companyId)))
      return { ok: false, error: "Tu web todavía no está preparada para publicarse desde Zenzia. Escríbenos y la activamos." };

    // RLS: solo devuelve los textos de la empresa del usuario.
    const { data: rows, error } = await supabase.from("web_texts").select("key, value").eq("company_id", companyId);
    if (error) throw new Error(error.message);

    const files = await buildSite(companyId, rows ?? []);
    const stamp = new Date().toISOString();
    await deployToNetlify(co.netlify_site_id, files, `Publicado desde Zenzia · ${stamp}`);

    await supabase.from("companies").update({ web_published_at: stamp }).eq("id", companyId);
    revalidatePath("/mi-web");
    return { ok: true, publishedAt: stamp };
  } catch (e) {
    console.error("publishWebsite", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo publicar" };
  }
}
