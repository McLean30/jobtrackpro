import { describe, it, expect } from "vitest";
import { parseDateToIso } from "./dates";

describe("parseDateToIso", () => {
  it("passes through ISO dates", () => {
    expect(parseDateToIso("2023-05-01")).toBe("2023-05-01");
  });

  it("parses UK day/month/year", () => {
    expect(parseDateToIso("01/05/2023")).toBe("2023-05-01");
    expect(parseDateToIso("31/12/2024")).toBe("2024-12-31");
  });

  it("parses with dashes day-month-year", () => {
    expect(parseDateToIso("01-05-2023")).toBe("2023-05-01");
  });

  it("returns null for blanks and nonsense", () => {
    expect(parseDateToIso("")).toBeNull();
    expect(parseDateToIso(null)).toBeNull();
    expect(parseDateToIso("not a date")).toBeNull();
    expect(parseDateToIso("32/13/2020")).toBeNull();
  });
});
