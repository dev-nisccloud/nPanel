import { describe, expect, test } from "bun:test";
import { GAVA_ENDPOINTS } from "../src/endpoints";
import { GAVA_CONNECT_LIVE_ORDER, OSCU_FUNCTION_COVERAGE } from "./gava-connect-order";

describe("certification / OSCU coverage", () => {
  test("live order starts at initialize and includes every Gava path", () => {
    expect(GAVA_CONNECT_LIVE_ORDER[0]?.endpointKey).toBe("selectInitOsdcInfo");
    expect(GAVA_CONNECT_LIVE_ORDER.at(-1)?.id).toBe("26-credit-note");
    const used = new Set(GAVA_CONNECT_LIVE_ORDER.map((s) => s.endpointKey));
    for (const key of Object.keys(GAVA_ENDPOINTS) as (keyof typeof GAVA_ENDPOINTS)[]) {
      expect(used.has(key)).toBe(true);
    }
  });

  test("function coverage lists every endpoint key once per OSCU category", () => {
    const keys = OSCU_FUNCTION_COVERAGE.map((r) => r.endpointKey);
    expect(new Set(keys).size).toBe(Object.keys(GAVA_ENDPOINTS).length);
  });

  test("working order puts stock I/O before composition and stock master", () => {
    const io = GAVA_CONNECT_LIVE_ORDER.findIndex((s) => s.id === "11-stock-io");
    const comp = GAVA_CONNECT_LIVE_ORDER.findIndex((s) => s.id === "12-composition");
    const master = GAVA_CONNECT_LIVE_ORDER.findIndex((s) => s.id === "18-stock-master");
    expect(io).toBeGreaterThan(-1);
    expect(io).toBeLessThan(comp);
    expect(io).toBeLessThan(master);
  });
});
