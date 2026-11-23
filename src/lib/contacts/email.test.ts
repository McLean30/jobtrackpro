import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  John.Doe@Example.COM  ")).toBe(
      "john.doe@example.com",
    );
  });

  it("collapses internal surrounding spaces", () => {
    expect(normalizeEmail("\tuser@Domain.co.uk\n")).toBe("user@domain.co.uk");
  });

  it("returns empty string for null/undefined/blank", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail("   ")).toBe("");
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.domain.co.uk")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("two@@at.com")).toBe(false);
    expect(isValidEmail("space in@email.com")).toBe(false);
    expect(isValidEmail("@nolocal.com")).toBe(false);
    expect(isValidEmail("nodomain@")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
  });
});
