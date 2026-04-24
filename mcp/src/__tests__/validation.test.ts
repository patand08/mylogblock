import { describe, it, expect } from "vitest";
import { validateSlug, sanitizeSlug } from "../validation.js";

describe("sanitizeSlug", () => {
  it("lowercases input", () => {
    expect(sanitizeSlug("Hello")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(sanitizeSlug("my page")).toBe("my-page");
  });

  it("strips invalid characters", () => {
    expect(sanitizeSlug("hello!@#world")).toBe("helloworld");
  });

  it("collapses multiple hyphens", () => {
    expect(sanitizeSlug("a--b---c")).toBe("a-b-c");
  });

  it("handles mixed input", () => {
    expect(sanitizeSlug("  My Cool Page! ")).toBe("my-cool-page");
  });
});

describe("validateSlug", () => {
  it("returns null for empty string (remove slug)", () => {
    expect(validateSlug("")).toBeNull();
  });

  it("accepts a valid slug", () => {
    expect(validateSlug("my-page")).toBeNull();
  });

  it("accepts a single character", () => {
    expect(validateSlug("a")).toBeNull();
  });

  it("accepts numbers", () => {
    expect(validateSlug("page-123")).toBeNull();
  });

  it("rejects uppercase letters", () => {
    expect(validateSlug("MyPage")).not.toBeNull();
  });

  it("rejects slug shorter than 2 chars — wait, single char is ok", () => {
    expect(validateSlug("a")).toBeNull();
  });

  it("rejects slug with leading hyphen", () => {
    expect(validateSlug("-my-page")).not.toBeNull();
  });

  it("rejects slug with trailing hyphen", () => {
    expect(validateSlug("my-page-")).not.toBeNull();
  });

  it("rejects slug with spaces", () => {
    expect(validateSlug("my page")).not.toBeNull();
  });

  it("rejects slug with special characters", () => {
    expect(validateSlug("my_page!")).not.toBeNull();
  });

  it("rejects slug longer than 60 characters", () => {
    expect(validateSlug("a".repeat(61))).not.toBeNull();
  });

  it("accepts slug of exactly 60 characters", () => {
    expect(validateSlug("a".repeat(60))).toBeNull();
  });

  it("rejects reserved word 'page'", () => {
    expect(validateSlug("page")).not.toBeNull();
  });

  it("rejects reserved word 'api'", () => {
    expect(validateSlug("api")).not.toBeNull();
  });

  it("rejects reserved word 'mcp'", () => {
    expect(validateSlug("mcp")).not.toBeNull();
  });

  it("rejects reserved word 'health'", () => {
    expect(validateSlug("health")).not.toBeNull();
  });

  it("returns a string error message when invalid", () => {
    const result = validateSlug("MyPage");
    expect(typeof result).toBe("string");
    expect(result!.length).toBeGreaterThan(0);
  });
});
