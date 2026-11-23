import { describe, it, expect } from "vitest";
import { processImport, type ColumnMapping } from "./import";

const mapping: ColumnMapping = {
  email: "Email",
  first_name: "First",
  last_name: "Last",
  customer_status: "Status",
  last_purchase_date: "Last Purchase",
};

function row(
  email: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return { Email: email, First: "", Last: "", Status: "", "Last Purchase": "", ...extra };
}

describe("processImport", () => {
  it("accepts valid rows and defaults them to pending_review", () => {
    const result = processImport(
      [row("alice@example.com", { First: "Alice", Last: "Smith" })],
      mapping,
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].eligibility_status).toBe("pending_review");
    expect(result.accepted[0].email_normalized).toBe("alice@example.com");
    expect(result.accepted[0].first_name).toBe("Alice");
    expect(result.summary.pendingReview).toBe(1);
    expect(result.summary.accepted).toBe(1);
  });

  it("never marks an imported contact as eligible", () => {
    const result = processImport(
      [
        row("a@example.com", { Status: "subscribed" }),
        row("b@example.com", { Status: "opted-in" }),
      ],
      mapping,
    );
    expect(result.accepted.every((c) => c.eligibility_status === "pending_review")).toBe(
      true,
    );
  });

  it("normalises emails (case + whitespace)", () => {
    const result = processImport([row("  BOB@Example.COM ")], mapping);
    expect(result.accepted[0].email_normalized).toBe("bob@example.com");
    // original (trimmed) retained for display
    expect(result.accepted[0].email).toBe("BOB@Example.COM");
  });

  it("rejects malformed emails", () => {
    const result = processImport(
      [row("good@example.com"), row("not-an-email")],
      mapping,
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toBe("malformed_email");
    expect(result.summary.malformed).toBe(1);
  });

  it("rejects rows with a missing email", () => {
    const result = processImport([row(""), row("ok@example.com")], mapping);
    expect(result.rejected[0].reason).toBe("missing_email");
    expect(result.summary.missingEmail).toBe(1);
    expect(result.accepted).toHaveLength(1);
  });

  it("detects duplicates within the same file (case-insensitive)", () => {
    const result = processImport(
      [row("dup@example.com"), row("DUP@EXAMPLE.COM"), row("unique@example.com")],
      mapping,
    );
    expect(result.accepted).toHaveLength(2);
    const dup = result.rejected.find((r) => r.reason === "duplicate_in_file");
    expect(dup).toBeTruthy();
    expect(result.summary.duplicatesInFile).toBe(1);
  });

  it("detects duplicates against existing contacts", () => {
    const result = processImport([row("existing@example.com")], mapping, {
      existingNormalizedEmails: ["existing@example.com"],
    });
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0].reason).toBe("duplicate_existing");
    expect(result.summary.duplicatesExisting).toBe(1);
  });

  it("parses last purchase dates and keeps invalid ones as null without rejecting", () => {
    const result = processImport(
      [
        row("d1@example.com", { "Last Purchase": "01/05/2023" }),
        row("d2@example.com", { "Last Purchase": "garbage" }),
      ],
      mapping,
    );
    expect(result.accepted).toHaveLength(2);
    expect(result.accepted[0].last_purchase_date).toBe("2023-05-01");
    expect(result.accepted[1].last_purchase_date).toBeNull();
  });

  it("preserves unmapped-but-present extra columns as custom fields", () => {
    const m: ColumnMapping = { email: "Email" };
    const result = processImport(
      [{ Email: "c@example.com", Region: "London", Tier: "Gold" }],
      m,
    );
    expect(result.accepted[0].custom_fields).toEqual({
      Region: "London",
      Tier: "Gold",
    });
  });

  it("computes a correct summary total", () => {
    const result = processImport(
      [row("a@example.com"), row("bad"), row(""), row("a@example.com")],
      mapping,
    );
    expect(result.summary.totalRows).toBe(4);
    expect(
      result.summary.accepted + result.summary.rejected,
    ).toBe(4);
  });
});
