import { describe, expect, test } from "bun:test";
import { isEmptySearch, omitNullish, parseExpectedCounter, unwrapKraResult } from "../src/unwrap";
import { isBusinessSuccess, RESULT } from "../src/errors";

describe("unwrap Gava envelope", () => {
  test("reads responseBody", () => {
    const r = unwrapKraResult(
      {
        responseHeader: { responseCode: 200 },
        responseBody: { resultCd: "000", resultMsg: "Successful", resultDt: "20260911122132", data: { rcptSign: "ABC" } },
      },
      200,
    );
    expect(r.resultCd).toBe("000");
    expect((r.data as { rcptSign: string }).rcptSign).toBe("ABC");
  });

  test("reads flat OSCU body", () => {
    const r = unwrapKraResult({ resultCd: "902", resultMsg: "This device is installed", data: null }, 200);
    expect(r.resultCd).toBe(RESULT.DEVICE_ALREADY_INSTALLED);
    expect(isBusinessSuccess(r.resultCd)).toBe(true);
  });
});

describe("empty search (HTTP 400 is not a hard failure)", () => {
  test("resultCd 001", () => {
    expect(isEmptySearch(200, { resultCd: "001", resultMsg: "There is no search result" })).toBe(true);
  });

  test("HTTP 400 with KRA empty message", () => {
    expect(isEmptySearch(400, { resultMsg: "There is no search result" }, "There is no search result")).toBe(true);
  });

  test("HTTP 500 is not empty even if message mentions data", () => {
    expect(isEmptySearch(500, { resultMsg: "There is no search result" })).toBe(false);
  });
});

describe("session counters", () => {
  test("parses Expected: N but found", () => {
    expect(parseExpectedCounter("Invoice number error. Expected: 2 but found: 3")).toBe(2);
  });
});

describe("omitNullish", () => {
  test("drops nulls recursively so KRA does not reject them", () => {
    const cleaned = omitNullish({ a: 1, b: null, c: { d: null, e: 2 }, f: [1, null, { g: null, h: 3 }] });
    expect(cleaned).toEqual({
      a: 1,
      c: { e: 2 },
      f: [1, { h: 3 }],
    } as typeof cleaned);
  });
});
