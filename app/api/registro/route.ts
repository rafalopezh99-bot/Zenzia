import { NextResponse } from "next/server";
import { signupRedirect } from "@/lib/signup";

// Alta de cuenta (formulario de /registro) como ruta normal, para que no
// dependa de los ids de server actions de cada despliegue.
export async function POST(req: Request) {
  const path = await signupRedirect(await req.formData());
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}
