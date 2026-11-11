import { describe, it, expect, beforeEach } from "vitest";
import { closeDb } from "../../lib/db";
import * as auth from "../../lib/auth";

const SETUP = "TESTCODE";
beforeEach(() => closeDb());

describe("passcode hashing", () => {
  it("verifies the right passcode and rejects others", () => {
    const h = auth.hashPasscode("246810");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(auth.verifyPasscode("246810", h)).toBe(true);
    expect(auth.verifyPasscode("135790", h)).toBe(false);
    expect(auth.verifyPasscode("246810", "garbage")).toBe(false);
  });
});

describe("login", () => {
  it("sets the passcode on first login, then requires it", () => {
    expect(auth.hasPasscode()).toBe(false);
    expect(auth.login("12", undefined, SETUP)).toEqual({ ok: false, error: "too_short" });
    expect(auth.login("246810", undefined, SETUP)).toEqual({ ok: true, created: true });
    expect(auth.login("246810")).toEqual({ ok: true, created: false });
    expect(auth.login("000000")).toMatchObject({ ok: false, error: "wrong" });
  });

  it("refuses first-run login without the right setup code and sets nothing", () => {
    expect(auth.login("246810")).toEqual({ ok: false, error: "setup_code" });
    expect(auth.login("246810", undefined, "WRONG")).toEqual({ ok: false, error: "setup_code" });
    expect(auth.hasPasscode()).toBe(false);
  });

  it("treats a 5-character passcode as too short", () => {
    expect(auth.login("12345", undefined, SETUP)).toEqual({ ok: false, error: "too_short" });
    expect(auth.hasPasscode()).toBe(false);
  });

  it("doubles the lock on a second lock and a success resets it", () => {
    const t0 = 1_000_000;
    auth.login("246810", t0, SETUP);
    for (let i = 0; i < 4; i++) auth.login("000000", t0);
    expect(auth.login("000000", t0)).toMatchObject({ error: "locked", retryAt: t0 + auth.LOCK_MS });
    const t1 = t0 + auth.LOCK_MS + 1;
    for (let i = 0; i < 4; i++) auth.login("000000", t1);
    expect(auth.login("000000", t1)).toMatchObject({ error: "locked", retryAt: t1 + 2 * auth.LOCK_MS });
    const t2 = t1 + 2 * auth.LOCK_MS + 1;
    expect(auth.login("246810", t2)).toEqual({ ok: true, created: false });
    for (let i = 0; i < 4; i++) auth.login("000000", t2);
    expect(auth.login("000000", t2)).toMatchObject({ error: "locked", retryAt: t2 + auth.LOCK_MS });
  });

  it("locks for 5 minutes after 5 wrong tries", () => {
    const t0 = 1_000_000;
    auth.login("246810", t0, SETUP);
    for (let i = 0; i < 4; i++) expect(auth.login("000000", t0)).toMatchObject({ error: "wrong" });
    expect(auth.login("000000", t0)).toMatchObject({ error: "locked", retryAt: t0 + auth.LOCK_MS });
    expect(auth.login("246810", t0 + 1000)).toMatchObject({ error: "locked" });
    expect(auth.login("246810", t0 + auth.LOCK_MS + 1)).toEqual({ ok: true, created: false });
  });

  it("changes the passcode only with the current one", () => {
    auth.login("246810", undefined, SETUP);
    expect(auth.changePasscode("000000", "999999")).toBe(false);
    expect(auth.changePasscode("246810", "999999")).toBe(true);
    expect(auth.login("999999")).toEqual({ ok: true, created: false });
  });
});

describe("session tokens", () => {
  it("round-trips and rejects tampering", async () => {
    const t = await auth.createSessionToken();
    expect(await auth.verifySessionToken(t)).toBe(true);
    expect(await auth.verifySessionToken(t + "x")).toBe(false);
    expect(await auth.verifySessionToken(null)).toBe(false);
  });
});
