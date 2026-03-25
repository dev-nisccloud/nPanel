import { getAllTldExtensions } from "@nPanel/utils";

/** Compound TLDs (e.g. co.ke, co.uk) not in the single-segment TLD list */
const COMPOUND_TLDS = [
  "co.ke",
  "co.uk",
  "com.au",
  "co.za",
  "com.br",
  "com.mx",
  "org.uk",
  "ac.uk",
  "net.uk",
  "co.nz",
  "co.jp",
  "com.ar",
  "com.co",
];

let validTldSet: Set<string> | null = null;

function getValidTldSet(): Set<string> {
  if (validTldSet) return validTldSet;
  const single = getAllTldExtensions() as readonly string[];
  validTldSet = new Set([...single, ...COMPOUND_TLDS]);
  return validTldSet;
}

/**
 * Normalize raw search input: trim, lowercase, remove protocol/www/trailing slash.
 * Does NOT strip TLD (we need it to detect query-with-TLD).
 */
function normalizeInput(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/\/+$/, "");
  s = s.replace(/^www\./i, "");
  return s.trim();
}

/**
 * Parse search query that may contain a valid TLD (e.g. "example.com", "example.co.ke").
 * Tries longest match first (e.g. "co.ke") then single segment ("com").
 *
 * @param rawQuery - Raw user input (e.g. "example.com", "Example.Co.Ke")
 * @returns { name, extension } if the query ends with a valid TLD and has a non-empty name; null otherwise
 */
export function parseQueryWithTld(rawQuery: string): { name: string; extension: string } | null {
  const normalized = normalizeInput(rawQuery);
  if (!normalized) return null;

  const parts = normalized.split(".");
  if (parts.length < 2) return null;

  const validTlds = getValidTldSet();

  // Try two-part extension first (e.g. co.ke)
  if (parts.length >= 3) {
    const twoPartExt = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (validTlds.has(twoPartExt)) {
      const name = parts.slice(0, -2).join(".");
      if (name.length > 0 && !name.includes("..")) {
        return { name, extension: twoPartExt };
      }
    }
  }

  // Single-part extension (e.g. com, ai, net)
  const onePartExt = parts[parts.length - 1];
  if (validTlds.has(onePartExt)) {
    const name = parts.slice(0, -1).join(".");
    if (name.length > 0 && !name.includes("..")) {
      return { name, extension: onePartExt };
    }
  }

  return null;
}
