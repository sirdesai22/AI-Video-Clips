import { cookies } from "next/headers";
import { COOKIE, verifySessionToken } from "./auth";

export async function isAuthed(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(COOKIE)?.value);
}

/** For route handlers: returns a 401 response when not signed in, otherwise null. */
export async function requireAuth(): Promise<Response | null> {
  return (await isAuthed()) ? null : Response.json({ error: "Not signed in" }, { status: 401 });
}
