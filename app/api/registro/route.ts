import { NextResponse } from "next/server";
import { signupRedirect } from "@/lib/signup";
import { publicOrigin } from "@/lib/origin";

// Alta de cuenta (formulario de /registro) como ruta normal, para que no
// dependa de los ids de server actions de cada despliegue.
export async function POST(req: Request) {
  const origin = publicOrigin(req);
  const path = await signupRedirect(await req.formData(), origin);
  return NextResponse.redirect(new URL(path, origin), { status: 303 });
}
