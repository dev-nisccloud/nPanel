/**
 * fast-xml-parser turns empty `<packet></packet>` into "" (string).
 * Plesk also returns a single object instead of an array when there is one result.
 */

export function normalizePleskPacket(value: unknown): Record<string, unknown> {
  if (value == null || value === "") return {};
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
    return {};
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return {};
}

export function asPleskArray(value: unknown): unknown[] {
  if (value == null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

/** getById may return one object or a one-item array. */
export function firstPleskResult(value: unknown): unknown {
  if (Array.isArray(value)) return value[0];
  return value;
}
