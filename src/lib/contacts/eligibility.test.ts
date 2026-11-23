import { describe, it, expect } from "vitest";
import {
  defaultEligibilityStatus,
  validateEligibilityChange,
} from "./eligibility";

describe("defaultEligibilityStatus", () => {
  it("is always pending_review", () => {
    expect(defaultEligibilityStatus()).toBe("pending_review");
  });
});

describe("validateEligibilityChange", () => {
  it("blocks marking eligible without recorded permission evidence", () => {
    const result = validateEligibilityChange({
      status: "eligible",
      suppressionReason: null,
      hasEvidence: false,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/evidence/i);
  });

  it("allows eligible when evidence is recorded", () => {
    const result = validateEligibilityChange({
      status: "eligible",
      suppressionReason: null,
      hasEvidence: true,
    });
    expect(result.ok).toBe(true);
  });

  it("requires a suppression reason to accompany ineligible-by-suppression", () => {
    const ok = validateEligibilityChange({
      status: "ineligible",
      suppressionReason: "unsubscribed",
      hasEvidence: false,
    });
    expect(ok.ok).toBe(true);
  });

  it("rejects a suppression reason on a non-ineligible status", () => {
    const result = validateEligibilityChange({
      status: "eligible",
      suppressionReason: "unsubscribed",
      hasEvidence: true,
    });
    expect(result.ok).toBe(false);
  });

  it("allows pending_review with no evidence and no suppression", () => {
    expect(
      validateEligibilityChange({
        status: "pending_review",
        suppressionReason: null,
        hasEvidence: false,
      }).ok,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = validateEligibilityChange({
      // @ts-expect-error testing runtime guard
      status: "approved",
      suppressionReason: null,
      hasEvidence: true,
    });
    expect(result.ok).toBe(false);
  });
});
