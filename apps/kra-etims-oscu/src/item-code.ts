/**
 * Official KRA itemCd (OSCU §7.18):
 *   [Country(2)][Type(1)][PkgUnit(2)][QtyUnit(2)][Seq(7)]
 * Example: KE1NTBA0000001
 *
 * Do not insert an "X" between pkg and qty — Apigee treats that as qtyUnitCd "XU".
 * Qty units must be 2 characters in the code (`U` fails with "Incorrect QtyUnitCd Prefix").
 */

export type ItemCdParts = {
  orgnNatCd: string;
  itemTyCd: string;
  pkgUnitCd: string;
  qtyUnitCd: string;
  sequence: number;
};

export function padQtyUnit(qtyUnitCd: string): string {
  const u = qtyUnitCd.trim().toUpperCase();
  if (u.length === 1) {
    throw new Error(
      `qtyUnitCd "${u}" cannot be used in itemCd (needs 2 chars). Use BA, KG, NT, etc.`,
    );
  }
  return u.slice(0, 5);
}

export function buildItemCd(parts: ItemCdParts): string {
  const country = parts.orgnNatCd.trim().toUpperCase().slice(0, 2);
  const type = String(parts.itemTyCd).trim().slice(0, 1);
  const pkg = parts.pkgUnitCd.trim().toUpperCase().slice(0, 5);
  const qty = padQtyUnit(parts.qtyUnitCd);
  const seq = String(Math.max(1, Math.trunc(parts.sequence))).padStart(7, "0");
  return `${country}${type}${pkg}${qty}${seq}`;
}

export function parseItemCd(itemCd: string): ItemCdParts | null {
  const s = itemCd.trim().toUpperCase();
  if (s.length < 12) return null;
  const orgnNatCd = s.slice(0, 2);
  const itemTyCd = s.slice(2, 3);
  const rest = s.slice(3);
  const seq = rest.slice(-7);
  const middle = rest.slice(0, -7);
  if (!/^\d{7}$/.test(seq) || middle.length < 2) return null;
  const pkgUnitCd = middle.slice(0, 2);
  const qtyUnitCd = middle.slice(2);
  return {
    orgnNatCd,
    itemTyCd,
    pkgUnitCd,
    qtyUnitCd,
    sequence: Number.parseInt(seq, 10),
  };
}

export function nextItemCd(
  existing: string[],
  opts: Omit<ItemCdParts, "sequence">,
): string {
  const prefix = `${opts.orgnNatCd}${opts.itemTyCd}${opts.pkgUnitCd}${padQtyUnit(opts.qtyUnitCd)}`;
  let maxSeq = 0;
  for (const cd of existing) {
    if (!cd.toUpperCase().startsWith(prefix.toUpperCase())) continue;
    const parsed = parseItemCd(cd);
    if (parsed) maxSeq = Math.max(maxSeq, parsed.sequence);
  }
  return buildItemCd({ ...opts, sequence: maxSeq + 1 });
}

export function itemCdWithExpectedSeq(itemCd: string, expectedEnding: string): string | null {
  const m = expectedEnding.match(/(\d+)$/);
  if (!m || itemCd.length < 7) return null;
  const seq = m[1]!.padStart(7, "0");
  return `${itemCd.slice(0, -7)}${seq}`;
}
