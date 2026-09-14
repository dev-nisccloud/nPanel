import { describe, expect, test } from "bun:test";
import { salesLineAmounts, taxBuckets, mergeTaxHeaders } from "../src/tax";
import { buildSalesLine, buildSale } from "../src/builders";

describe("VAT buckets", () => {
  test("tax B 1000 exclusive → 160 VAT → 1160 inclusive", () => {
    const t = taxBuckets("B", 1000);
    expect(t.taxblAmtB).toBe(1000);
    expect(t.taxAmtB).toBe(160);
    expect(t.totAmt).toBe(1160);
    expect(t.taxRtB).toBe(16);
  });

  test("exempt A has zero tax", () => {
    const t = taxBuckets("A", 1000);
    expect(t.taxAmtA).toBe(0);
    expect(t.totAmt).toBe(1000);
  });
});

describe("Gava Connect sales line: splyAmt === prc * qty using VAT-inclusive prc", () => {
  test("qty 1", () => {
    const line = salesLineAmounts({ taxTyCd: "B", taxblAmt: 1000, qty: 1 });
    expect(line.prc).toBe(1160);
    expect(line.splyAmt).toBe(1160);
    expect(line.splyAmt).toBe(line.prc * line.qty);
  });

  test("qty 2 multiplies inclusive unit price", () => {
    const line = salesLineAmounts({ taxTyCd: "B", taxblAmt: 1000, qty: 2 });
    expect(line.prc).toBe(1160);
    expect(line.splyAmt).toBe(2320);
    expect(line.taxblAmt).toBe(2000);
    expect(line.taxAmt).toBe(320);
  });

  test("builder line + sale header", () => {
    const itemList = [
      buildSalesLine({
        itemSeq: 1,
        itemCd: "KE1NTBA0000001",
        itemNm: "Cert goods",
        itemClsCd: "1010150100",
        pkgUnitCd: "NT",
        qtyUnitCd: "BA",
        taxTyCd: "B",
        taxblAmt: 1000,
        qty: 1,
      }),
    ];
    const sale = buildSale({
      trdInvcNo: "CERT121920",
      invcNo: 1,
      itemList,
      cfmDt: "20260911122132",
      salesDt: "20260911",
    });
    expect(sale.itemList[0]!.splyAmt).toBe(sale.itemList[0]!.prc * sale.itemList[0]!.qty);
    expect(sale.taxblAmtB).toBe(1000);
    expect(sale.taxAmtB).toBe(160);
    expect(sale.totAmt).toBe(1160);
    expect(sale.rcptTyCd).toBe("S");
    expect((sale as { taxbl?: number }).taxbl).toBeUndefined();
  });

  test("merge two bands", () => {
    const m = mergeTaxHeaders([
      { taxTyCd: "B", taxblAmt: 1000, taxAmt: 160, totAmt: 1160 },
      { taxTyCd: "A", taxblAmt: 500, taxAmt: 0, totAmt: 500 },
    ]);
    expect(m.taxblAmtB).toBe(1000);
    expect(m.taxblAmtA).toBe(500);
    expect(m.totAmt).toBe(1660);
  });
});
