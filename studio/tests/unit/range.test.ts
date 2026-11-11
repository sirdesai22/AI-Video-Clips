import { describe, it, expect } from "vitest";
import { parseRange } from "../../lib/range";

describe("parseRange", () => {
  it("handles missing, open, closed and suffix ranges", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=0-", 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=10-19", 100)).toEqual({ start: 10, end: 19 });
    expect(parseRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
  });
  it("rejects bad ranges", () => {
    expect(parseRange("bytes=200-", 100)).toBe("invalid");
    expect(parseRange("bytes=5-1", 100)).toBe("invalid");
    expect(parseRange("items=0-1", 100)).toBe("invalid");
    expect(parseRange("bytes=-", 100)).toBe("invalid");
  });
});
