import { cookies } from "next/headers";
import { COOKIE, assertSessionSecret, SESSION_DAYS, createSessionToken, login } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { passcode, setupCode } = (await req.json().catch(() => ({}))) as { passcode?: string; setupCode?: string };
  assertSessionSecret();
  const r = login(String(passcode ?? ""), Date.now(), setupCode === undefined ? undefined : String(setupCode));
  if (!r.ok) return Response.json(r, { status: r.error === "locked" ? 429 : 401 });
  (await cookies()).set(COOKIE, await createSessionToken(), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return Response.json(r);
}
