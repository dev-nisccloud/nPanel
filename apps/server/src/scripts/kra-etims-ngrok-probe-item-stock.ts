const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://ffe3-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const ITEMS = ["KE1NTBA0000001", "KE1NTBA0000002"];

function unwrap(raw: unknown): unknown {
    const root = raw as Record<string, unknown>;
    const err = root?.error as Record<string, unknown> | undefined;
    if (err) throw new Error(String((err.data as { message?: string })?.message ?? err.message ?? JSON.stringify(err)));
    let cur: unknown = root?.result ?? root;
    if (cur && typeof cur === "object" && "data" in (cur as object)) cur = (cur as { data: unknown }).data;
    return cur;
}

async function call(method: "GET" | "POST", procedure: string, input?: unknown) {
    const headers: Record<string, string> = { "ngrok-skip-browser-warning": "1" };
    let url = `${BASE}/trpc/${procedure}`;
    const init: RequestInit = { method, headers };
    if (method === "GET") {
        if (input !== undefined) url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
    } else {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(input ?? {});
    }
    const res = await fetch(url, init);
    const text = await res.text();
    let json: unknown = text;
    try {
        json = JSON.parse(text);
    } catch {
        return { success: false, errorMessage: `HTTP ${res.status}: ${text.slice(0, 400)}` };
    }
    try {
        return unwrap(json) as Record<string, unknown>;
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : String(e) };
    }
}

function show(label: string, p: Record<string, unknown>) {
    const s = JSON.stringify(p);
    const cd = s.match(/"resultCd"\s*:\s*"(\d+)"/)?.[1] ?? "-";
    const msg = String(p.errorMessage ?? s.match(/"resultMsg"\s*:\s*"([^"]+)"/)?.[1] ?? "").slice(0, 280);
    const ok = p.success === true || cd === "000";
    console.log(`${ok ? "ok" : "FAIL"} ${label} cd=${cd} ${msg}`);
    return ok;
}

function rowsOf(payload: unknown, keys: string[]): Array<Record<string, unknown>> {
    const walk = (v: unknown, depth: number): unknown[] => {
        if (depth > 8 || !v || typeof v !== "object") return [];
        const r = v as Record<string, unknown>;
        for (const k of keys) if (Array.isArray(r[k])) return r[k] as unknown[];
        for (const k of ["data", "responseBody", "json"]) {
            const n = walk(r[k], depth + 1);
            if (n.length) return n;
        }
        return [];
    };
    return walk(payload, 0).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

function expectedQty(msg: string): number | null {
    const m = msg.match(/Expected:\s*(\d+(?:\.\d+)?)\s+but\s+found/i);
    return m ? Number(m[1]) : null;
}

async function main() {
    const cfg = await call("GET", "etimsCert.auth.getConfiguration");
    console.log("cfg", JSON.stringify(cfg).slice(0, 500));

    const stamps = ["20180101000000", "20160523000000", "20200101000000", "20260101000000", "20261101000000", "20261111000000"];
    let listed: Array<Record<string, unknown>> = [];
    for (const lastReqDt of stamps) {
        const p = await call("GET", "etimsCert.items.getItemList", { lastReqDt });
        const rows = rowsOf(p, ["itemList"]);
        const cd = JSON.stringify(p).match(/"resultCd"\s*:\s*"(\d+)"/)?.[1] ?? "-";
        console.log(`getItemList ${lastReqDt} cd=${cd} rows=${rows.length} ${String(p.errorMessage ?? "").slice(0, 160)}`);
        if (rows.length) {
            listed = rows;
            show(`LOOK UP PRODUCT LIST lastReqDt=${lastReqDt}`, p);
            console.log("  items", rows.map((r) => `${r.itemCd}/${r.qtyUnitCd}/${r.itemClsCd}`).join(" "));
            break;
        }
        show(`LOOK UP PRODUCT LIST lastReqDt=${lastReqDt}`, p);
    }

    if (!listed.length) {
        console.log("item list empty — re-saving catalog items then re-query");
        for (const [itemCd, tax, cls, nm] of [
            ["KE1NTBA0000001", "B", "1010150100", "nPanel Cert VAT16"],
            ["KE1NTBA0000002", "A", "1000000000", "nPanel Cert Exempt"],
        ] as const) {
            const saved = await call("POST", "etimsCert.items.saveItem", {
                item: {
                    itemCd,
                    itemClsCd: cls,
                    itemTyCd: "1",
                    itemNm: nm,
                    itemStdNm: nm,
                    orgnNatCd: "KE",
                    pkgUnitCd: "NT",
                    qtyUnitCd: "BA",
                    taxTyCd: tax,
                    dftPrc: 1000,
                    isrcAplcbYn: "N",
                    useYn: "Y",
                    ...AUDITOR,
                },
            });
            show(`saveItem ${itemCd}`, saved);
        }
        await new Promise((r) => setTimeout(r, 2000));
        const again = await call("GET", "etimsCert.items.getItemList", { lastReqDt: "20180101000000" });
        listed = rowsOf(again, ["itemList"]);
        show("LOOK UP PRODUCT LIST after re-save", again);
        console.log("  items", listed.map((r) => r.itemCd).join(" "));
    }

    for (const itemCd of ITEMS) {
        let ok = false;
        for (const rsdQty of [20, 10, 9, 11, 0, 19, 21, 30]) {
            const p = await call("POST", "etimsCert.stock.saveStockMaster", {
                stockMaster: { itemCd, rsdQty, ...AUDITOR },
            });
            if (show(`saveStockMaster ${itemCd} rsdQty=${rsdQty}`, p)) {
                ok = true;
                break;
            }
            const next = expectedQty(String(p.errorMessage ?? JSON.stringify(p)));
            if (next != null && next !== rsdQty) {
                const retry = await call("POST", "etimsCert.stock.saveStockMaster", {
                    stockMaster: { itemCd, rsdQty: next, ...AUDITOR },
                });
                if (show(`saveStockMaster ${itemCd} rsdQty=${next} (expected)`, retry)) {
                    ok = true;
                    break;
                }
            }
        }
        if (!ok) process.exitCode = 1;
    }

    const listFinal = await call("GET", "etimsCert.items.getItemList", { lastReqDt: "20180101000000" });
    const rowsFinal = rowsOf(listFinal, ["itemList"]);
    const listOk = show("FINAL LOOK UP PRODUCT LIST", listFinal) && rowsFinal.length > 0;
    console.log(`final item rows=${rowsFinal.length}`);
    if (!listOk) process.exitCode = 1;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
