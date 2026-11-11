import { describe, it, expect, beforeEach } from "vitest";
import { closeDb } from "../../lib/db";
import * as auth from "../../lib/auth";

beforeEach(() => closeDb());

describe("passcode hashing", () => {
  it("verifies the right passcode and rejects others", () => {
    const h = auth.hashPasscode("2468");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(auth.verifyPasscode("2468", h)).toBe(true);
    expect(auth.verifyPasscode("1357", h)).toBe(false);
    expect(auth.verifyPasscode("2468", "garbage")).toBe(false);
  });
});

describe("login", () => {
  it("sets the passcode on first login, then requires it", () => {
    expect(auth.hasPasscode()).toBe(false);
    expect(auth.login("12")).toEqual({ ok: false, error: "too_short" });
    expect(auth.login("2468")).toEqual({ ok: true, created: true });
    expect(auth.login("2468")).toEqual({ ok: true, created: false });
    expect(auth.login("0000")).toMatchObject({ ok: false, error: "wrong" });
  });

  it("locks for 5 minutes after 5 wrong tries", () => {
    const t0 = 1_000_000;
    auth.login("2468", t0);
    for (let i = 0; i < 4; i++) expect(auth.login("0000", t0)).toMatchObject({ error: "wrong" });
    expect(auth.login("0000", t0)).toMatchObject({ error: "locked", retryAt: t0 + auth.LOCK_MS });
    expect(auth.login("2468", t0 + 1000)).toMatchObject({ error: "locked" });
    expect(auth.login("2468", t0 + auth.LOCK_MS + 1)).toEqual({ ok: true, created: false });
  });

  it("changes the passcode only with the current one", () => {
    auth.login("2468");
    expect(auth.changePasscode("0000", "9999")).toBe(false);
    expect(auth.changePasscode("2468", "9999")).toBe(true);
    expect(auth.login("9999")).toEqual({ ok: true, created: false });
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
