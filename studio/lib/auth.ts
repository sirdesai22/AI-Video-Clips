import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getSetting, setSetting } from "./db";

export const COOKIE = "rs_session";
export const SESSION_DAYS = 30;
export const LOCK_AFTER = 5;
export const LOCK_MS = 5 * 60 * 1000;

export type LoginResult =
  | { ok: true; created: boolean }
  | { ok: false; error: "too_short" }
  | { ok: false; error: "wrong" | "locked"; retryAt?: number };

export function hashPasscode(p: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(p, salt, 32).toString("hex")}`;
}

export function verifyPasscode(p: string, stored: string): boolean {
  const [alg, s, h] = stored.split("$");
  if (alg !== "scrypt" || !s || !h) return false;
  const calc = scryptSync(p, Buffer.from(s, "hex"), 32);
  const exp = Buffer.from(h, "hex");
  return exp.length === calc.length && timingSafeEqual(calc, exp);
}

export const hasPasscode = () => !!getSetting("passcode_hash");

function lockedUntil(now: number): number | null {
  const v = Number(getSetting("lock_until") ?? 0);
  return v > now ? v : null;
}

function resetFailures() {
  setSetting("fail_count", "0");
  setSetting("lock_until", "0");
}

export function login(passcode: string, now = Date.now()): LoginResult {
  const lu = lockedUntil(now);
  if (lu) return { ok: false, error: "locked", retryAt: lu };
  const stored = getSetting("passcode_hash");
  if (!stored) {
    if (passcode.length < 4) return { ok: false, error: "too_short" };
    setSetting("passcode_hash", hashPasscode(passcode));
    resetFailures();
    return { ok: true, created: true };
  }
  if (verifyPasscode(passcode, stored)) {
    resetFailures();
    return { ok: true, created: false };
  }
  const n = Number(getSetting("fail_count") ?? 0) + 1;
  if (n >= LOCK_AFTER) {
    setSetting("lock_until", String(now + LOCK_MS));
    setSetting("fail_count", "0");
    return { ok: false, error: "locked", retryAt: now + LOCK_MS };
  }
  setSetting("fail_count", String(n));
  return { ok: false, error: "wrong" };
}

export function changePasscode(current: string, next: string): boolean {
  const stored = getSetting("passcode_hash");
  if (!stored || !verifyPasscode(current, stored) || next.length < 4) return false;
  setSetting("passcode_hash", hashPasscode(next));
  return true;
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET is missing: run `npm run setup`");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`).sign(secret());
}

export async function verifySessionToken(t?: string | null): Promise<boolean> {
  if (!t) return false;
  try { await jwtVerify(t, secret()); return true; } catch { return false; }
}
