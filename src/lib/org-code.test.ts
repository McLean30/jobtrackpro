import { describe, it, expect } from "vitest";
import { slugifyOrgCode, withSuffix } from "./org-code";

describe("slugifyOrgCode", () => {
  it("uppercases and hyphenates", () => {
    expect(slugifyOrgCode("Acme Plumbing Ltd")).toBe("ACME-PLUMBING-LTD");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugifyOrgCode("Bright & Wave, Fitness!")).toBe("BRIGHT-WAVE-FITNESS");
  });

  it("trims leading/trailing separators", () => {
    expect(slugifyOrgCode("  --Oakleaf--  ")).toBe("OAKLEAF");
  });

  it("caps length at 30 characters", () => {
    const code = slugifyOrgCode("A".repeat(50));
    expect(code.length).toBeLessThanOrEqual(30);
  });

  it("falls back to ORG for empty/short names", () => {
    expect(slugifyOrgCode("!!!")).toBe("ORG");
    expect(slugifyOrgCode("")).toBe("ORG");
  });
});

describe("withSuffix", () => {
  it("returns base unchanged for n<=1", () => {
    expect(withSuffix("ACME", 1)).toBe("ACME");
  });

  it("appends numeric suffix", () => {
    expect(withSuffix("ACME", 3)).toBe("ACME-3");
  });

  it("keeps total length within 39 chars", () => {
    expect(withSuffix("A".repeat(39), 12).length).toBeLessThanOrEqual(39);
  });
});
