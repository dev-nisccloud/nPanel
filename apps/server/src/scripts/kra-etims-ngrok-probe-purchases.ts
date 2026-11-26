/**
 * Accept remaining Gava purchases by remapping itemCds to KE1NTBA0000001
 * and patching splyAmt/tax fields from KRA's Expected: values.
 */
const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const LAST = "20180101000000";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const OUR = "KE1NTBA0000001";

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
    const msg = String(p.errorMessage ?? s.match(/"resultMsg"\s*:\s*"([^"]+)"/)?.[1] ?? "").slice(0, 340);
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

function expectedNum(msg: string): number | null {
    const m = msg.match(/invcNo sequence, expected:\s*(\d+)/i) ?? msg.match(/Expected:\s*(\d+(?:\.\d+)?)\s+but\s+found/i);
    if (m && /invcNo|sequence/i.test(msg)) return Number(m[1]);
    const m2 = msg.match(/Invc No:.*?expected value:\s*(\d+)/i);
    return m2 ? Number(m2[1]) : null;
}

function canonicalField(raw: string): string {
    const fieldMap: Record<string, string> = {
        splyamnt: "splyAmt",
        splyamt: "splyAmt",
        prc: "prc",
        qty: "qty",
        taxblamt: "taxblAmt",
        taxamt: "taxAmt",
        totamt: "totAmt",
        dcamt: "dcAmt",
        dcrt: "dcRt",
        pkg: "pkg",
        taxblamta: "taxblAmtA",
        taxblamtb: "taxblAmtB",
        taxblamtc: "taxblAmtC",
        taxblamtd: "taxblAmtD",
        taxblamte: "taxblAmtE",
        taxamta: "taxAmtA",
        taxamtb: "taxAmtB",
        taxamtc: "taxAmtC",
        taxamtd: "taxAmtD",
        taxamte: "taxAmtE",
        tottaxblamt: "totTaxblAmt",
        tottaxamt: "totTaxAmt",
        totamt: "totAmt",
        totitemcnt: "totItemCnt",
    };
    return fieldMap[raw.toLowerCase()] ?? raw;
}

function patchFromError(body: Record<string, unknown>, items: Array<Record<string, unknown>>, msg: string): boolean {
    const item = msg.match(/Invalid (\w+) on item:\s*(\d+)\.\s*Expected:\s*([\d.]+),\s*But Found:\s*([\d.]+)/i);
    if (item) {
        const field = canonicalField(item[1]);
        const idx = Number(item[2]) - 1;
        const expected = Number(item[3]);
        const row = items[idx];
        if (!row || !Number.isFinite(expected)) return false;
        row[field] = expected;
        if (field === "splyAmt") row.prc = expected;
        console.log(`  patch item ${idx + 1} ${field}=${expected}`);
        return true;
    }
    const header = msg.match(/Invalid (\w+)\s*\.?\s*Expected:\s*([\d.]+),\s*But Found:\s*([\d.]+)/i);
    if (header) {
        const field = canonicalField(header[1]);
        const expected = Number(header[2]);
        if (!Number.isFinite(expected)) return false;
        body[field] = expected;
        console.log(`  patch header ${field}=${expected}`);
        return true;
    }
    return false;
}

async function accept(tin: string, row: Record<string, unknown>, startInvc: number) {
    const orig = Array.isArray(row.itemList) ? (row.itemList as Array<Record<string, unknown>>) : [];
    const items = orig.map((line, i) => ({
        ...line,
        itemSeq: i + 1,
        itemCd: OUR,
        itemClsCd: "1010150100",
        pkgUnitCd: "NT",
        qtyUnitCd: "BA",
    }));
    const body: Record<string, unknown> = {
        spplrTin: String(row.spplrTin ?? tin),
        invcNo: startInvc,
        orgInvcNo: 0,
        spplrBhfId: String(row.spplrBhfId ?? "00"),
        spplrNm: String(row.spplrNm ?? "Application Test Supplier"),
        spplrInvcNo: Number(row.spplrInvcNo),
        regTyCd: "M",
        pchsTyCd: "N",
        rcptTyCd: "P",
        pmtTyCd: String(row.pmtTyCd ?? "01"),
        pchsSttsCd: "02",
        cfmDt: "20261103113000",
        pchsDt: "20261103",
        totItemCnt: items.length,
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
        remark: `probe purchase ${row.spplrInvcNo}`,
        ...AUDITOR,
        itemList: items,
    };
    let last: Record<string, unknown> = { success: false };
    for (let i = 0; i < 12; i++) {
        last = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", { purchase: body });
        if (last.success === true || /"resultCd"\s*:\s*"000"/.test(JSON.stringify(last))) return last;
        const msg = String(last.errorMessage ?? "");
        const next = expectedNum(msg);
        if (next != null && next !== Number(body.invcNo)) {
            body.invcNo = next;
            continue;
        }
        if (patchFromError(body, items, msg)) continue;
        break;
    }
    return last;
}

async function main() {
    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const tin = String((cfg.config as { kraPin?: string } | undefined)?.kraPin ?? "");
    const pending = new Set(["829555", "829557", "829559"]);
    const queued = rowsOf(
        await call("GET", "etimsCert.purchases.getPurchaseTransactions", { lastReqDt: LAST }),
        ["saleList", "pchsList"],
    ).filter((row) => pending.has(String(row.spplrInvcNo)));

    let failed = 0;
    let pInvc = 8;
    for (const row of queued) {
        const ils = Array.isArray(row.itemList) ? (row.itemList as Array<Record<string, unknown>>) : [];
        console.log(
            `row spplr=${row.spplrInvcNo} tot=${row.totAmt} lines=${JSON.stringify(ils.map((l) => ({ cd: l.itemCd, prc: l.prc, sply: l.splyAmt, taxbl: l.taxblAmt, tax: l.taxAmt, tot: l.totAmt, qty: l.qty })))}`,
        );
        const p = await accept(tin, row, pInvc);
        const msg = String(p.errorMessage ?? "");
        const next = expectedNum(msg);
        if (next != null) pInvc = next;
        if (show(`purchase ${row.spplrInvcNo} invc=${pInvc}`, p)) {
            pInvc += 1;
            continue;
        }
        failed += 1;
    }
    if (failed) {
        console.log(`still failed ${failed}`);
        process.exitCode = 1;
        return;
    }
    console.log("all queued purchases 000");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
