/**
 * Free invcNo 4 or otherwise force saveTrnsSalesOsdc 000.
 */
const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const LAST = "20180101000000";

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
    const msg = String(p.errorMessage ?? s.match(/"resultMsg"\s*:\s*"([^"]+)"/)?.[1] ?? "").slice(0, 220);
    const ok = p.success === true || cd === "000";
    console.log(`${ok ? "ok" : "FAIL"} ${label} cd=${cd} ${msg}`);
    return ok;
}

function compactDt(v: unknown): string | null {
    if (v == null) return null;
    const d = String(v).replace(/\D/g, "");
    if (d.length >= 14) return d.slice(0, 14);
    if (d.length === 8) return `${d}120000`;
    return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstSale(payload: unknown): Record<string, unknown> | null {
    const walk = (v: unknown, depth: number): Record<string, unknown> | null => {
        if (depth > 10 || !v || typeof v !== "object") return null;
        const r = v as Record<string, unknown>;
        if (Array.isArray(r.salesList) && r.salesList[0]) return asRecord(r.salesList[0]);
        for (const k of ["data", "result", "responseBody", "json"]) {
            const n = walk(r[k], depth + 1);
            if (n) return n;
        }
        return null;
    };
    return walk(payload, 0);
}

function rows(payload: unknown, keys: string[]): Record<string, unknown>[] {
    const walk = (v: unknown, depth: number): unknown[] => {
        if (depth > 10 || !v || typeof v !== "object") return [];
        const r = v as Record<string, unknown>;
        for (const k of keys) if (Array.isArray(r[k])) return r[k] as unknown[];
        for (const k of ["data", "result", "responseBody", "json"]) {
            const n = walk(r[k], depth + 1);
            if (n.length) return n;
        }
        return [];
    };
    return walk(payload, 0).map(asRecord).filter((x): x is Record<string, unknown> => Boolean(x));
}

function kraNow() {
    const list = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(new Date());
    const g = (t: string) => list.find((p) => p.type === t)?.value ?? "00";
    const salesDt = `${g("year")}${g("month")}${g("day")}`;
    let hh = Number(g("hour") === "24" ? "00" : g("hour"));
    if (hh > 12) hh -= 12;
    if (hh === 0) hh = 12;
    return { salesDt, noon: `${salesDt}120000`, now12: `${salesDt}${String(hh).padStart(2, "0")}${g("minute")}${g("second")}` };
}

function saleLine() {
    return {
        itemSeq: 1,
        itemCd: "KE1NTBA0000001",
        itemClsCd: "1010150100",
        itemNm: "nPanel Cert VAT16",
        pkgUnitCd: "NT",
        pkg: 1,
        qtyUnitCd: "BA",
        qty: 1,
        prc: 1160,
        splyAmt: 1160,
        dcRt: 0,
        dcAmt: 0,
        taxTyCd: "B",
        taxblAmt: 1000,
        taxAmt: 160,
        totAmt: 1160,
    };
}

function rebuildFromStored(sale: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
    const receipt = asRecord(sale.receipt) ?? {};
    const items = Array.isArray(sale.itemList) ? sale.itemList : [saleLine()];
    const cfm = compactDt(sale.cfmDt) ?? compactDt(receipt.rcptPbctDt) ?? compactDt(receipt.sdcDateTime) ?? "20261015124046";
    const salesDt = String(sale.salesDt ?? cfm.slice(0, 8)).replace(/\D/g, "").slice(0, 8);
    return {
        trdInvcNo: String(sale.trdInvcNo ?? `NP${Date.now().toString().slice(-8)}`),
        invcNo: Number(sale.invcNo ?? 4),
        orgInvcNo: Number(sale.orgInvcNo ?? 0),
        custTin: sale.custTin ?? null,
        custNm: sale.custNm ?? "Application Test Customer",
        salesTyCd: sale.salesTyCd ?? "N",
        rcptTyCd: sale.rcptTyCd ?? "S",
        pmtTyCd: sale.pmtTyCd ?? "01",
        salesSttsCd: sale.salesSttsCd ?? "02",
        cfmDt: cfm,
        salesDt,
        stockRlsDt: compactDt(sale.stockRlsDt) ?? cfm,
        cnclReqDt: compactDt(sale.cnclReqDt),
        cnclDt: compactDt(sale.cnclDt),
        rfdDt: compactDt(sale.rfdDt),
        rfdRsnCd: sale.rfdRsnCd ?? null,
        totItemCnt: items.length,
        taxblAmtA: Number(sale.taxblAmtA ?? 0),
        taxblAmtB: Number(sale.taxblAmtB ?? 0),
        taxblAmtC: Number(sale.taxblAmtC ?? 0),
        taxblAmtD: Number(sale.taxblAmtD ?? 0),
        taxblAmtE: Number(sale.taxblAmtE ?? 0),
        taxRtA: Number(sale.taxRtA ?? 0),
        taxRtB: Number(sale.taxRtB ?? 16),
        taxRtC: Number(sale.taxRtC ?? 0),
        taxRtD: Number(sale.taxRtD ?? 0),
        taxRtE: Number(sale.taxRtE ?? 0),
        taxAmtA: Number(sale.taxAmtA ?? 0),
        taxAmtB: Number(sale.taxAmtB ?? 0),
        taxAmtC: Number(sale.taxAmtC ?? 0),
        taxAmtD: Number(sale.taxAmtD ?? 0),
        taxAmtE: Number(sale.taxAmtE ?? 0),
        totTaxblAmt: Number(sale.totTaxblAmt ?? 0),
        totTaxAmt: Number(sale.totTaxAmt ?? 0),
        totAmt: Number(sale.totAmt ?? 0),
        prchrAcptcYn: sale.prchrAcptcYn ?? "N",
        remark: sale.remark ?? "replay",
        regrId: sale.regrId ?? "Admin",
        regrNm: sale.regrNm ?? "Admin",
        modrId: "Admin",
        modrNm: "Admin",
        receipt: {
            custTin: receipt.custTin ?? sale.custTin ?? null,
            custMblNo: receipt.custMblNo ?? "0700000000",
            rcptPbctDt: compactDt(receipt.rcptPbctDt) ?? cfm,
            trdeNm: receipt.trdeNm ?? "nPanel 7",
            adrs: receipt.adrs ?? "Nairobi",
            topMsg: receipt.topMsg ?? null,
            btmMsg: receipt.btmMsg ?? null,
            prchrAcptcYn: receipt.prchrAcptcYn ?? "N",
        },
        itemList: items,
        ...overrides,
    };
}

async function sendSale(label: string, transaction: Record<string, unknown>) {
    const p = await call("POST", "etimsCert.sales.sendSalesTransaction", { transaction });
    return show(label, p);
}

async function sendCn(label: string, transaction: Record<string, unknown>) {
    const p = await call("POST", "etimsCert.sales.sendCreditNote", { transaction });
    return show(label, p);
}

async function sendPurchase(label: string, purchase: Record<string, unknown>) {
    const p = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", { purchase });
    return show(label, p);
}

async function main() {
    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const tin = String((asRecord(cfg.config) ?? {}).kraPin ?? "P600005001A");
    const { noon, now12, salesDt } = kraNow();
    console.log(`break-sale ${BASE} tin=${tin} noon=${noon} now12=${now12}`);

    const d4 = await call("GET", "etimsCert.sales.getInvoiceDetails", { invcNo: 4 });
    const sale4 = firstSale(d4);
    console.log("invc4 stored", JSON.stringify(sale4)?.slice(0, 500));

    if (sale4) {
        const replay = rebuildFromStored(sale4);
        if (await sendSale("replay exact invc4", replay)) return;

        const cancelReq = rebuildFromStored(sale4, {
            salesSttsCd: "03",
            cnclReqDt: noon,
            remark: "cancel request invc4",
        });
        await sendSale("cancel request stts 03 invc4", cancelReq);

        const cancelled = rebuildFromStored(sale4, {
            salesSttsCd: "04",
            cnclReqDt: noon,
            cnclDt: noon,
            remark: "cancelled invc4",
        });
        await sendSale("cancel confirm stts 04 invc4", cancelled);
    }

    const purchases = await call("GET", "etimsCert.purchases.getPurchaseTransactions", { lastReqDt: LAST });
    const pRows = rows(purchases, ["saleList", "pchsList", "itemList"]);
    console.log(`queued/purchases ${pRows.length}`, pRows.map((r) => `invc=${r.invcNo} spplr=${r.spplrInvcNo} stts=${r.pchsSttsCd}`).join(" | "));
    const p4 = pRows.find((r) => Number(r.invcNo) === 4) ?? pRows.find((r) => Number(r.spplrInvcNo) === 4);
    if (p4) {
        const pchsDt = String(p4.pchsDt ?? salesDt).replace(/\D/g, "").slice(0, 8) || salesDt;
        const cfm = compactDt(p4.cfmDt) ?? `${pchsDt}120000`;
        const itemList = Array.isArray(p4.itemList) && p4.itemList.length ? p4.itemList : [saleLine()];
        for (const stts of ["03", "04"]) {
            const purchase = {
                spplrTin: p4.spplrTin ?? tin,
                invcNo: 4,
                orgInvcNo: Number(p4.orgInvcNo ?? 0),
                spplrBhfId: p4.spplrBhfId ?? "00",
                spplrNm: p4.spplrNm ?? "Application Test Supplier",
                spplrInvcNo: Number(p4.spplrInvcNo ?? 4),
                regTyCd: "M",
                pchsTyCd: "N",
                rcptTyCd: "P",
                pmtTyCd: p4.pmtTyCd ?? "01",
                pchsSttsCd: stts,
                cfmDt: cfm,
                pchsDt,
                cnclReqDt: noon,
                cnclDt: stts === "04" ? noon : null,
                totItemCnt: itemList.length,
                taxblAmtA: Number(p4.taxblAmtA ?? 0),
                taxblAmtB: Number(p4.taxblAmtB ?? 1000),
                taxblAmtC: Number(p4.taxblAmtC ?? 0),
                taxblAmtD: Number(p4.taxblAmtD ?? 0),
                taxblAmtE: Number(p4.taxblAmtE ?? 0),
                taxRtA: 0,
                taxRtB: 16,
                taxRtC: 0,
                taxRtD: 0,
                taxRtE: 0,
                taxAmtA: Number(p4.taxAmtA ?? 0),
                taxAmtB: Number(p4.taxAmtB ?? 160),
                taxAmtC: 0,
                taxAmtD: 0,
                taxAmtE: 0,
                totTaxblAmt: Number(p4.totTaxblAmt ?? 1000),
                totTaxAmt: Number(p4.totTaxAmt ?? 160),
                totAmt: Number(p4.totAmt ?? 1160),
                remark: `cancel purchase invc4 stts ${stts}`,
                ...AUDITOR,
                itemList,
            };
            await sendPurchase(`purchase cancel stts ${stts}`, purchase);
        }
    }

    const fresh = {
        trdInvcNo: `NP${Date.now().toString().slice(-8)}`,
        invcNo: 4,
        orgInvcNo: 0,
        custTin: tin,
        custNm: "Application Test Customer",
        salesTyCd: "N",
        rcptTyCd: "S",
        pmtTyCd: "01",
        salesSttsCd: "02",
        cfmDt: noon,
        salesDt,
        stockRlsDt: noon,
        totItemCnt: 1,
        taxblAmtA: 0,
        taxblAmtB: 1000,
        taxblAmtC: 0,
        taxblAmtD: 0,
        taxblAmtE: 0,
        taxRtA: 0,
        taxRtB: 16,
        taxRtC: 0,
        taxRtD: 0,
        taxRtE: 0,
        taxAmtA: 0,
        taxAmtB: 160,
        taxAmtC: 0,
        taxAmtD: 0,
        taxAmtE: 0,
        totTaxblAmt: 1000,
        totTaxAmt: 160,
        totAmt: 1160,
        prchrAcptcYn: "N",
        remark: "fresh NS after cancel",
        ...AUDITOR,
        receipt: {
            custTin: tin,
            custMblNo: "0700000000",
            rcptPbctDt: noon,
            trdeNm: "nPanel 7",
            adrs: "Nairobi",
            prchrAcptcYn: "N",
        },
        itemList: [saleLine()],
    };
    if (await sendSale("fresh NS invc4 after cancel", fresh)) return;

    const cn = {
        ...fresh,
        trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
        orgInvcNo: 3,
        rcptTyCd: "R",
        rfdDt: noon,
        rfdRsnCd: "06",
        remark: "CN org3 after cancel",
    };
    if (await sendCn("CN org3 invc4 after cancel", cn)) return;

    const copy = { ...fresh, salesTyCd: "C", trdInvcNo: `COPY${Date.now().toString().slice(-6)}`, remark: "CS after cancel" };
    if (await sendSale("CS invc4 after cancel", copy)) return;

    const train = { ...fresh, salesTyCd: "T", trdInvcNo: `TR${Date.now().toString().slice(-6)}`, remark: "TS after cancel" };
    if (await sendSale("TS invc4 after cancel", train)) return;

    console.log("lock still held");
    process.exitCode = 1;
}

main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
