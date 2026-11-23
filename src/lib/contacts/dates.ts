/**
 * Lenient date parsing for imported "last purchase date" values.
 * Accepts ISO (yyyy-mm-dd) and UK day-first formats (dd/mm/yyyy, dd-mm-yyyy).
 * Returns an ISO date string (yyyy-mm-dd) or null when unparseable — a bad
 * date never rejects the whole contact, it is simply stored as null.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoFromYMD(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseDateToIso(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!value) return null;

  // ISO: yyyy-mm-dd
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return isoFromYMD(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // UK day-first: dd/mm/yyyy or dd-mm-yyyy
  const uk = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (uk) {
    return isoFromYMD(Number(uk[3]), Number(uk[2]), Number(uk[1]));
  }

  return null;
}
