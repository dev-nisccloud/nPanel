import { describe, expect, test } from "bun:test";
import { creditNoteRefundDt, isKraDateTime, kraDate, kraDateTime } from "../src/dates";
import { buildReceiptVerifyUrl } from "../src/receipt";

describe("Africa/Nairobi stamps", () => {
  test("14-digit date-time and 8-digit date", () => {
    const dt = kraDateTime(new Date("2026-09-11T09:21:32+03:00"));
    expect(isKraDateTime(dt)).toBe(true);
    expect(dt).toBe("20260911092132");
    expect(kraDate(new Date("2026-09-11T09:21:32+03:00"))).toBe("20260911");
  });

  test("credit-note rfdDt is after original sdcDateTime", () => {
    const rfd = creditNoteRefundDt("20260911122132", new Date("2026-09-11T09:21:32+03:00"));
    expect(rfd > "20260911122132").toBe(true);
  });
});

describe("receipt verification URL", () => {
  test("sandbox query is PIN + bhfId + rcptSign", () => {
    expect(
      buildReceiptVerifyUrl({
        tin: "P600004455A",
        bhfId: "00",
        rcptSign: "5AWILTL6HKHBQ754",
        environment: "sandbox",
      }),
    ).toBe(
      "https://etims-sbx.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?P600004455A005AWILTL6HKHBQ754",
    );
  });

  test("production host is etims.kra.go.ke", () => {
    const url = buildReceiptVerifyUrl({
      tin: "P600004455A",
      bhfId: "00",
      rcptSign: "QZAOVZMXZWMBP7OA",
      environment: "production",
    });
    expect(url?.startsWith("https://etims.kra.go.ke/")).toBe(true);
  });
});
