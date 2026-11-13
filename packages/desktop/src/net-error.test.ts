import { describe, expect, it } from "vitest";
import { NET_ERRORS, failureOf } from "./net-error.ts";

describe("failureOf", () => {
  it("gives a reason for each failed load, and no reason for a replaced load", () => {
    expect(failureOf(-3)).toBeUndefined();
    expect(failureOf(-118)).toBe("timeout");
    expect(failureOf(-7)).toBe("timeout");
    expect(failureOf(-10)).toBe("refused");
    expect(failureOf(-20)).toBe("refused");
    expect(failureOf(-102)).toBe("refused");
    expect(failureOf(-27)).toBe("refused");
    expect(failureOf(-105)).toBe("network");
    expect(failureOf(-200)).toBe("network");
  });

  it("names the Chromium codes", () => {
    expect(NET_ERRORS).toEqual({
      ABORTED: -3,
      TIMED_OUT: -7,
      ACCESS_DENIED: -10,
      BLOCKED_BY_CLIENT: -20,
      BLOCKED_BY_RESPONSE: -27,
      CONNECTION_REFUSED: -102,
      CONNECTION_TIMED_OUT: -118,
    });
  });
});
