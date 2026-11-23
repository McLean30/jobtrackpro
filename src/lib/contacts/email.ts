/**
 * Email normalisation and validation.
 *
 * Normalisation is deliberately conservative: trim + lowercase only.
 * We do NOT strip Gmail dots or "+tags", because those can merge genuinely
 * distinct inboxes and would risk contacting the wrong person.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string | null | undefined): string {
  if (raw == null) return "";
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  if (email.length > 254) return false;
  return EMAIL_RE.test(email);
}
