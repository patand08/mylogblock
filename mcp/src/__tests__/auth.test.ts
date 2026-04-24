import { describe, it, expect } from "vitest";
import { checkApiKey } from "../auth.js";

describe("checkApiKey", () => {
  const SECRET = "test-secret-key";

  it("returns true for correct Bearer token", () => {
    expect(checkApiKey(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("returns false for missing authorization header", () => {
    expect(checkApiKey(undefined, SECRET)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(checkApiKey("", SECRET)).toBe(false);
  });

  it("returns false for wrong token", () => {
    expect(checkApiKey("Bearer wrong-token", SECRET)).toBe(false);
  });

  it("returns false for token without Bearer prefix", () => {
    expect(checkApiKey(SECRET, SECRET)).toBe(false);
  });

  it("returns false for Bearer with no token", () => {
    expect(checkApiKey("Bearer ", SECRET)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(checkApiKey(`Bearer ${SECRET.toUpperCase()}`, SECRET)).toBe(false);
  });
});
