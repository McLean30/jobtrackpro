/**
 * Derive a candidate organisation code from a company name.
 * Codes are uppercase A-Z/0-9 with hyphens, matching the DB constraint
 * `^[A-Z0-9][A-Z0-9-]{1,38}$`. Uniqueness is resolved by the caller.
 */
export function slugifyOrgCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 30);
  return slug.length >= 2 ? slug : "ORG";
}

/** Append a numeric suffix while respecting the 39-char maximum length. */
export function withSuffix(base: string, n: number): string {
  if (n <= 1) return base;
  const suffix = `-${n}`;
  return `${base.slice(0, 39 - suffix.length)}${suffix}`;
}
