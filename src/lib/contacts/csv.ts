import Papa from "papaparse";

/** Hard cap on contacts per import (spec: up to 5,000). */
export const MAX_IMPORT_ROWS = 5000;

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  error?: string;
}

/**
 * Parse CSV text into header list + array of string-keyed rows.
 * Fully blank lines are skipped. Enforces the row cap.
 */
export function parseCsv(text: string): ParsedCsv {
  if (!text || !text.trim()) {
    return { headers: [], rows: [], error: "The file is empty." };
  }

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const headers = (parsed.meta.fields ?? []).filter((h) => h.length > 0);
  if (headers.length === 0) {
    return { headers: [], rows: [], error: "No column headers were found." };
  }

  const rows: Record<string, string>[] = (parsed.data ?? []).map((raw) => {
    const row: Record<string, string> = {};
    for (const key of Object.keys(raw)) {
      if (!key) continue;
      const value = raw[key];
      row[key] = value == null ? "" : String(value).trim();
    }
    return row;
  });

  if (rows.length === 0) {
    return { headers, rows: [], error: "The file has no data rows." };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      headers,
      rows: [],
      error: `This file has ${rows.length} rows, which exceeds the limit of ${MAX_IMPORT_ROWS} contacts per import.`,
    };
  }

  return { headers, rows };
}
