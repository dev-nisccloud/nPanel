import { describe, expect, test } from "bun:test";
import { createKraOscuBrowserClient, createKraOscuClient } from "../src/client";
import { dispatchOscuProxy } from "../src/proxy";
import { GAVA_ENDPOINTS } from "../src/endpoints";

describe("proxy transport (frontend → backend)", () => {
  test("browser client posts endpointKey and never asks for a secret", async () => {
    const posted: unknown[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      posted.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      return new Response(
        JSON.stringify({ resultCd: "000", resultMsg: "ok", resultDt: "20260911000000", data: { clsList: [] }, statusCode: 200, raw: {} }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    try {
      const kra = createKraOscuBrowserClient({ proxyUrl: "https://api.example.com/kra-oscu" });
      kra.setIdentity({ tin: "P600004455A", bhfId: "00", cmcKey: "stored" });
      const r = await kra.getCodeList("20180101000000");
      expect(r.resultCd).toBe("000");
      expect(posted).toEqual([
        {
          url: "https://api.example.com/kra-oscu",
          body: {
            endpointKey: "selectCodeList",
            body: { lastReqDt: "20180101000000" },
            identity: { tin: "P600004455A", bhfId: "00", cmcKey: "stored" },
          },
        },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("server dispatch forwards every OSCU key", async () => {
    const seen: string[] = [];
    const kra = createKraOscuClient({
      environment: "sandbox",
      transport: async (key, body) => {
        seen.push(key);
        return { resultCd: "000", resultMsg: "ok", resultDt: null, data: body, statusCode: 200, raw: null };
      },
    });
    kra.setIdentity({ tin: "P600004455A", bhfId: "00", cmcKey: "k" });
    for (const key of Object.keys(GAVA_ENDPOINTS) as (keyof typeof GAVA_ENDPOINTS)[]) {
      await dispatchOscuProxy(kra, { endpointKey: key, body: { ping: key } });
    }
    expect(seen.sort()).toEqual(Object.keys(GAVA_ENDPOINTS).sort());
  });
});
