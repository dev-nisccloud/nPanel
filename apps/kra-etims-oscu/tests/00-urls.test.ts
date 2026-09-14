import { describe, expect, test } from "bun:test";
import { detectHostKind, KRA_OSCU_URLS, resolveOscuUrls } from "../src/env";
import { CLASSIC_ENDPOINTS, GAVA_ENDPOINTS, endpointsFor } from "../src/endpoints";

describe("sandbox vs production hosts", () => {
  test("Gava Connect sandbox (what certification scored)", () => {
    const u = resolveOscuUrls("sandbox", "gava");
    expect(u.baseUrl).toBe("https://sbx.kra.go.ke/etims-oscu/api/v1");
    expect(u.tokenUrl).toBe("https://sbx.kra.go.ke/v1/token/generate");
    expect(u.receiptHost).toBe("https://etims-sbx.kra.go.ke");
  });

  test("Gava Connect production", () => {
    const u = resolveOscuUrls("production", "gava");
    expect(u.baseUrl).toBe("https://ra.kra.go.ke/etims-oscu/api/v1");
    expect(u.tokenUrl).toBe("https://ra.kra.go.ke/v1/token/generate");
    expect(u.receiptHost).toBe("https://etims.kra.go.ke");
  });

  test("classic OSCU sandbox (does not tick Gava Connect)", () => {
    const u = resolveOscuUrls("sandbox", "classic");
    expect(u.baseUrl).toBe("https://etims-api-sbx.kra.go.ke/etims-api");
  });

  test("detectHostKind", () => {
    expect(detectHostKind(KRA_OSCU_URLS.sandbox.gava.baseUrl)).toBe("gava");
    expect(detectHostKind(KRA_OSCU_URLS.sandbox.classic.baseUrl)).toBe("classic");
  });
});

describe("endpoint maps cover every OSCU function", () => {
  const keys = Object.keys(GAVA_ENDPOINTS) as (keyof typeof GAVA_ENDPOINTS)[];

  test("classic has the same keys as Gava", () => {
    expect(Object.keys(CLASSIC_ENDPOINTS).sort()).toEqual(keys.sort());
  });

  test("Gava init is /initialize, classic is /selectInitOsdcInfo", () => {
    expect(GAVA_ENDPOINTS.selectInitOsdcInfo).toBe("/initialize");
    expect(CLASSIC_ENDPOINTS.selectInitOsdcInfo).toBe("/selectInitOsdcInfo");
  });

  test("dashboard notices path is /selectNotices on Gava", () => {
    expect(GAVA_ENDPOINTS.selectNotices).toBe("/selectNotices");
    expect(GAVA_ENDPOINTS.selectNoticeList).toBe("/selectNoticeList");
  });

  test("stock I/O and master use insert/save suffixes on Gava", () => {
    expect(GAVA_ENDPOINTS.insertStockIO).toBe("/insert/stockIO");
    expect(GAVA_ENDPOINTS.saveStockMaster).toBe("/save/stockMaster");
  });

  test("endpointsFor switches maps", () => {
    expect(endpointsFor("gava").saveTrnsSalesOsdc).toBe("/sendSalesTransaction");
    expect(endpointsFor("classic").saveTrnsSalesOsdc).toBe("/saveTrnsSalesOsdc");
  });
});
