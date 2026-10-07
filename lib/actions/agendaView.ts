"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type AgendaView = "day" | "week" | "month";

// Vista de agenda que se abre por defecto al entrar en /citas. Se guarda
// en una cookie del navegador (preferencia personal, no de la empresa).
export async function setDefaultAgendaView(view: AgendaView) {
  cookies().set("agenda_view", view, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/citas");
}
