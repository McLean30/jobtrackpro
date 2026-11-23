import { describe, it, expect } from "vitest";
import { parseCsv, MAX_IMPORT_ROWS } from "./csv";

describe("parseCsv", () => {
  it("parses headers and rows keyed by header", () => {
    const text = "Email,First Name,Last Name\njane@x.com,Jane,Doe\n";
    const result = parseCsv(text);
    expect(result.error).toBeUndefined();
    expect(result.headers).toEqual(["Email", "First Name", "Last Name"]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      Email: "jane@x.com",
      "First Name": "Jane",
      "Last Name": "Doe",
    });
  });

  it("handles quoted fields containing commas", () => {
    const text = 'Email,Note\njohn@x.com,"Smith, John"\n';
    const result = parseCsv(text);
    expect(result.rows[0].Note).toBe("Smith, John");
  });

  it("ignores fully blank lines", () => {
    const text = "Email\na@x.com\n\n\nb@x.com\n";
    const result = parseCsv(text);
    expect(result.rows).toHaveLength(2);
  });

  it("errors on empty input", () => {
    expect(parseCsv("").error).toBeTruthy();
    expect(parseCsv("   ").error).toBeTruthy();
  });

  it("errors when no data rows are present", () => {
    expect(parseCsv("Email,Name").error).toBeTruthy();
  });

  it("errors when exceeding the row cap", () => {
    const rows = Array.from(
      { length: MAX_IMPORT_ROWS + 1 },
      (_, i) => `user${i}@x.com`,
    ).join("\n");
    const result = parseCsv(`Email\n${rows}\n`);
    expect(result.error).toContain(String(MAX_IMPORT_ROWS));
  });

  it("accepts exactly the row cap", () => {
    const rows = Array.from(
      { length: MAX_IMPORT_ROWS },
      (_, i) => `user${i}@x.com`,
    ).join("\n");
    const result = parseCsv(`Email\n${rows}\n`);
    expect(result.error).toBeUndefined();
    expect(result.rows).toHaveLength(MAX_IMPORT_ROWS);
  });
});
