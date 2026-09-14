import { TAX_TYPE, type TaxTyCd } from "./codes";

export type TaxBandTotals = {
  taxbl: number;
  tax: number;
  tot: number;
  taxblAmtA: number;
  taxblAmtB: number;
  taxblAmtC: number;
  taxblAmtD: number;
  taxblAmtE: number;
  taxRtA: number;
  taxRtB: number;
  taxRtC: number;
  taxRtD: number;
  taxRtE: number;
  taxAmtA: number;
  taxAmtB: number;
  taxAmtC: number;
  taxAmtD: number;
  taxAmtE: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function taxRate(taxTyCd: string): number {
  const key = taxTyCd.toUpperCase() as TaxTyCd;
  return TAX_TYPE[key]?.rate ?? 0;
}

/** Split a tax-exclusive amount into KRA header tax buckets. */
export function taxBuckets(taxTyCd: string, taxblAmt: number): TaxBandTotals {
  const band = taxTyCd.toUpperCase() as TaxTyCd;
  const taxbl = roundMoney(taxblAmt);
  const rate = taxRate(band);
  const tax = roundMoney((taxbl * rate) / 100);
  const tot = roundMoney(taxbl + tax);
  const empty = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const taxblBy = { ...empty, [band]: taxbl };
  const taxBy = { ...empty, [band]: tax };
  return {
    taxbl,
    tax,
    tot,
    taxblAmtA: taxblBy.A,
    taxblAmtB: taxblBy.B,
    taxblAmtC: taxblBy.C,
    taxblAmtD: taxblBy.D,
    taxblAmtE: taxblBy.E,
    taxRtA: 0,
    taxRtB: band === "B" ? 16 : 0,
    taxRtC: 0,
    taxRtD: 0,
    taxRtE: band === "E" ? 8 : 0,
    taxAmtA: taxBy.A,
    taxAmtB: taxBy.B,
    taxAmtC: taxBy.C,
    taxAmtD: taxBy.D,
    taxAmtE: taxBy.E,
    totTaxblAmt: taxbl,
    totTaxAmt: tax,
    totAmt: tot,
  };
}

/**
 * Gava Connect validates `splyAmt === prc * qty` using the VAT-inclusive unit
 * price (`tot`), not the tax-exclusive supply.
 */
export function salesLineAmounts(opts: {
  taxTyCd: string;
  taxblAmt: number;
  qty?: number;
}): { prc: number; splyAmt: number; taxblAmt: number; taxAmt: number; totAmt: number; qty: number } {
  const qty = opts.qty ?? 1;
  const t = taxBuckets(opts.taxTyCd, opts.taxblAmt);
  return {
    qty,
    prc: t.tot,
    splyAmt: roundMoney(t.tot * qty),
    taxblAmt: roundMoney(t.taxbl * qty),
    taxAmt: roundMoney(t.tax * qty),
    totAmt: roundMoney(t.tot * qty),
  };
}

export function mergeTaxHeaders(lines: Array<{ taxTyCd: string; taxblAmt: number; taxAmt: number; totAmt: number }>): TaxBandTotals {
  const acc = taxBuckets("A", 0);
  for (const line of lines) {
    const b = line.taxTyCd.toUpperCase() as TaxTyCd;
    const keyBl = `taxblAmt${b}` as const;
    const keyTx = `taxAmt${b}` as const;
    (acc as unknown as Record<string, number>)[keyBl] = roundMoney(((acc as unknown as Record<string, number>)[keyBl] ?? 0) + line.taxblAmt);
    (acc as unknown as Record<string, number>)[keyTx] = roundMoney(((acc as unknown as Record<string, number>)[keyTx] ?? 0) + line.taxAmt);
    acc.totTaxblAmt = roundMoney(acc.totTaxblAmt + line.taxblAmt);
    acc.totTaxAmt = roundMoney(acc.totTaxAmt + line.taxAmt);
    acc.totAmt = roundMoney(acc.totAmt + line.totAmt);
  }
  if (acc.taxblAmtB > 0) acc.taxRtB = 16;
  if (acc.taxblAmtE > 0) acc.taxRtE = 8;
  acc.taxbl = acc.totTaxblAmt;
  acc.tax = acc.totTaxAmt;
  acc.tot = acc.totAmt;
  return acc;
}
