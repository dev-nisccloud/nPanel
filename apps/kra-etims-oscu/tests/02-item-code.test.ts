import { describe, expect, test } from "bun:test";
import { buildItemCd, nextItemCd, parseItemCd, padQtyUnit } from "../src/item-code";

describe("official itemCd (no X separator)", () => {
  test("KE + type + pkg + qty + 7 digits", () => {
    expect(
      buildItemCd({ orgnNatCd: "KE", itemTyCd: "1", pkgUnitCd: "NT", qtyUnitCd: "BA", sequence: 1 }),
    ).toBe("KE1NTBA0000001");
  });

  test("qty unit must be 2 chars in the code", () => {
    expect(() =>
      buildItemCd({ orgnNatCd: "KE", itemTyCd: "1", pkgUnitCd: "NT", qtyUnitCd: "U", sequence: 1 }),
    ).toThrow(/2 chars/);
  });

  test("padQtyUnit rejects U", () => {
    expect(() => padQtyUnit("U")).toThrow(/Incorrect QtyUnitCd|2 chars/i);
  });

  test("parse round-trip", () => {
    const parsed = parseItemCd("KE1NTBA0000002");
    expect(parsed).toEqual({
      orgnNatCd: "KE",
      itemTyCd: "1",
      pkgUnitCd: "NT",
      qtyUnitCd: "BA",
      sequence: 2,
    });
  });

  test("next sequence after existing codes", () => {
    expect(
      nextItemCd(["KE1NTBA0000001", "KE1NTBA0000002"], {
        orgnNatCd: "KE",
        itemTyCd: "1",
        pkgUnitCd: "NT",
        qtyUnitCd: "BA",
      }),
    ).toBe("KE1NTBA0000003");
  });
});
