import { cookies } from "next/headers";
import { COOKIE, SESSION_DAYS, createSessionToken, login } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { passcode } = (await req.json().catch(() => ({}))) as { passcode?: string };
  const r = login(String(passcode ?? ""));
  if (!r.ok) return Response.json(r, { status: r.error === "locked" ? 429 : 401 });
  (await cookies()).set(COOKIE, await createSessionToken(), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return Response.json(r);
}
