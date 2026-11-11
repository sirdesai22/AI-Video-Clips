import { describe, it, expect } from "vitest";
import { isAllowedRequest } from "../../lib/request-guard";

const base = { method: "GET", host: "127.0.0.1:3000", origin: null, secFetchSite: null };

describe("isAllowedRequest", () => {
  it("allows localhost hosts", () => {
    expect(isAllowedRequest(base)).toBe(true);
    expect(isAllowedRequest({ ...base, host: "localhost:3000" })).toBe(true);
  });
  it("blocks a foreign host", () => {
    expect(isAllowedRequest({ ...base, host: "evil.example.com" })).toBe(false);
    expect(isAllowedRequest({ ...base, host: null })).toBe(false);
  });
  it("blocks cross-site and foreign-origin writes", () => {
    expect(isAllowedRequest({ ...base, method: "POST", secFetchSite: "cross-site" })).toBe(false);
    expect(isAllowedRequest({ ...base, method: "POST", origin: "http://evil.com" })).toBe(false);
  });
  it("allows same-origin writes", () => {
    expect(isAllowedRequest({ ...base, method: "POST", origin: "http://127.0.0.1:3000", secFetchSite: "same-origin" })).toBe(true);
  });
  it("allows a GET without origin", () => {
    expect(isAllowedRequest({ ...base, origin: null })).toBe(true);
  });
});
