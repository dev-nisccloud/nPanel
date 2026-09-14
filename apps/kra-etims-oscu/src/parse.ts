import type { CodeRow, ItemClassRow } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Flatten `/selectCodeList` `clsList` / `dtllist` into rows. */
export function flattenCodeList(data: unknown): CodeRow[] {
  const root = asRecord(data) ?? {};
  const clsList = listOf(root.clsList);
  const rows: CodeRow[] = [];
  for (const cls of clsList) {
    const c = asRecord(cls);
    if (!c) continue;
    const details = listOf(c.dtllist ?? c.dtlList ?? c.codeList);
    if (details.length === 0 && c.cd) {
      rows.push(c as CodeRow);
      continue;
    }
    for (const d of details) {
      const row = asRecord(d);
      if (!row) continue;
      rows.push({
        cdCls: String(c.cdCls ?? row.cdCls ?? ""),
        cdClsNm: String(c.cdClsNm ?? row.cdClsNm ?? ""),
        cd: String(row.cd ?? ""),
        cdNm: String(row.cdNm ?? ""),
        userDfnNm1: (row.userDfnNm1 as string | null) ?? null,
        userDfnNm2: (row.userDfnNm2 as string | null) ?? null,
        userDfnNm3: (row.userDfnNm3 as string | null) ?? null,
        useYn: row.useYn === "N" ? "N" : "Y",
      });
    }
  }
  const flat = listOf(root.codeList);
  for (const d of flat) {
    const row = asRecord(d);
    if (row) rows.push(row as CodeRow);
  }
  return rows;
}

export function codesByClass(rows: CodeRow[], cdCls: string): CodeRow[] {
  return rows.filter((r) => r.cdCls === cdCls);
}

export function parseItemClassList(data: unknown): ItemClassRow[] {
  const root = asRecord(data) ?? {};
  return listOf(root.itemClsList)
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => row != null)
    .map((row) => ({
      itemClsCd: String(row.itemClsCd ?? ""),
      itemClsNm: String(row.itemClsNm ?? ""),
      itemClsLvl: typeof row.itemClsLvl === "number" ? row.itemClsLvl : Number(row.itemClsLvl ?? 0) || undefined,
      taxTyCd: row.taxTyCd != null ? String(row.taxTyCd) : null,
      mjrTgYn: row.mjrTgYn === "Y" || row.mjrTgYn === "N" ? row.mjrTgYn : null,
      useYn: row.useYn === "N" ? "N" : "Y",
    }));
}

/** Leaf classifications for a tax band (cert sheet: A/B/C/D; skip E). */
export function pickItemClassForTax(list: ItemClassRow[], taxTyCd: string): ItemClassRow | null {
  const band = taxTyCd.toUpperCase();
  const usable = list.filter((r) => r.useYn !== "N" && r.itemClsCd);
  const exact = usable.filter((r) => (r.taxTyCd ?? "").toUpperCase() === band);
  const pool = exact.length ? exact : usable;
  const leaves = pool.filter((r) => (r.itemClsCd.length >= 10 && r.itemClsLvl == null) || r.itemClsLvl === 5 || r.itemClsCd.length === 10);
  return leaves[0] ?? pool[0] ?? null;
}

export function firstImportedItem(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data) ?? {};
  const list = listOf(root.itemList);
  const row = list.find((x) => asRecord(x)?.taskCd);
  return row ? asRecord(row) : null;
}

export function firstPurchaseSale(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data) ?? {};
  const list = listOf(root.saleList ?? root.pchsList ?? root.itemList);
  const row = list[0];
  return row ? asRecord(row) : null;
}
