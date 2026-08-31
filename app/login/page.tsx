import { signIn } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <form action={signIn} className="w-80 space-y-3 rounded-lg bg-neutral-950 p-6">
        <h1 className="text-lg font-semibold text-neutral-100">Zenzia</h1>
        <input
          name="email"
          className="w-full rounded bg-neutral-800 p-2 text-neutral-100"
          type="email"
          placeholder="Email"
          required
        />
        <input
          name="password"
          className="w-full rounded bg-neutral-800 p-2 text-neutral-100"
          type="password"
          placeholder="Contrasena"
          required
        />
        {searchParams?.error && <p className="text-sm text-red-400">{searchParams.error}</p>}
        <button className="w-full rounded bg-neutral-100 p-2 font-medium text-neutral-900">
          Entrar
        </button>
      </form>
    </div>
  );
}
