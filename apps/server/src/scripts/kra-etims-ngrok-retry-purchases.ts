const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const LAST = "20180101000000";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };

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
    const json = JSON.parse(await (await fetch(url, init)).text());
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

async function main() {
    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const tin = String((cfg.config as { kraPin?: string } | undefined)?.kraPin ?? "");
    console.log("tin", tin);

    for (const itemCd of ["KE1NTXU1000001", "KE1NTXU1000003", "KE1NTXU1000005"]) {
        const saved = await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd,
                itemClsCd: "5059690800",
                itemTyCd: "1",
                itemNm: itemCd,
                itemStdNm: itemCd,
                orgnNatCd: "KE",
                pkgUnitCd: "NT",
                qtyUnitCd: "U",
                taxTyCd: "B",
                dftPrc: 1000,
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        });
        show(`saveItem ${itemCd}`, saved);
    }

    const list = await call("GET", "etimsCert.purchases.getPurchaseTransactions", { lastReqDt: LAST });
    const queued = rowsOf(list, ["saleList", "pchsList", "itemList"]).filter((row) => row.spplrInvcNo != null);
    console.log("queued", queued.length, queued.map((r) => `${r.spplrInvcNo}:${JSON.stringify(r.itemList).slice(0, 80)}`).join(" | "));

    let pInvc = 8;
    for (const row of queued) {
        const spplrInvcNo = Number(row.spplrInvcNo);
        const itemList = Array.isArray(row.itemList) && row.itemList.length ? row.itemList : [];
        const payload = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", {
            purchase: {
                spplrTin: String(row.spplrTin ?? tin),
                invcNo: pInvc,
                orgInvcNo: 0,
                spplrBhfId: String(row.spplrBhfId ?? "00"),
                spplrNm: String(row.spplrNm ?? "Application Test Supplier"),
                spplrInvcNo,
                regTyCd: "M",
                pchsTyCd: "N",
                rcptTyCd: "P",
                pmtTyCd: String(row.pmtTyCd ?? "01"),
                pchsSttsCd: "02",
                cfmDt: "20261103113000",
                pchsDt: "20261103",
                totItemCnt: itemList.length || 1,
                taxblAmtA: Number(row.taxblAmtA ?? 0),
                taxblAmtB: Number(row.taxblAmtB ?? 0),
                taxblAmtC: Number(row.taxblAmtC ?? 0),
                taxblAmtD: Number(row.taxblAmtD ?? 0),
                taxblAmtE: Number(row.taxblAmtE ?? 0),
                taxRtA: Number(row.taxRtA ?? 0),
                taxRtB: Number(row.taxRtB ?? 16),
                taxRtC: Number(row.taxRtC ?? 0),
                taxRtD: Number(row.taxRtD ?? 0),
                taxRtE: Number(row.taxRtE ?? 0),
                taxAmtA: Number(row.taxAmtA ?? 0),
                taxAmtB: Number(row.taxAmtB ?? 0),
                taxAmtC: Number(row.taxAmtC ?? 0),
                taxAmtD: Number(row.taxAmtD ?? 0),
                taxAmtE: Number(row.taxAmtE ?? 0),
                totTaxblAmt: Number(row.totTaxblAmt ?? 0),
                totTaxAmt: Number(row.totTaxAmt ?? 0),
                totAmt: Number(row.totAmt ?? 0),
                remark: `retry purchase ${spplrInvcNo}`,
                ...AUDITOR,
                itemList,
            },
        });
        const msg = String(payload.errorMessage ?? "");
        const expected = msg.match(/Expected:\s*(\d+)/i);
        if (expected && Number(expected[1]) !== pInvc) {
            pInvc = Number(expected[1]);
            const retry = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", {
                purchase: { ...payload, invcNo: pInvc },
            });
            show(`purchase ${spplrInvcNo} invc ${pInvc}`, retry);
        } else {
            show(`purchase ${spplrInvcNo} invc ${pInvc}`, payload);
        }
        pInvc += 1;
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
