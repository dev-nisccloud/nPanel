/**
 * Retry the two remaining Gava fails: save sales (924) and save stock-master (rsdQty 20).
 */
const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const PARENT = "KE1NTBA0000001";
const CHILD = "KE1NTBA0000002";

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
    return unwrap(JSON.parse(await (await fetch(url, init)).text())) as Record<string, unknown>;
}

function expectedCounter(message: string): number | null {
    const m = message.match(/Expected:\s*(\d+(?:\.\d+)?)\s+but\s+found/i);
    return m ? Number(m[1]) : null;
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
    const hh = g("hour") === "24" ? "00" : g("hour");
    return { salesDt, cfmDt: `${salesDt}${hh}${g("minute")}${g("second")}` };
}

function show(label: string, p: Record<string, unknown>, extra = "") {
    const mark = p.success === true ? "ok" : "FAIL";
    const cd = JSON.stringify(p.data ?? {}).match(/"resultCd"\s*:\s*"(\d+)"/)?.[1];
    console.log(`${mark.padEnd(4)} ${label} ${extra} cd=${cd ?? "-"} error=${p.errorMessage ?? "-"}`.trim());
}

async function main() {
    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const tin = String((cfg.config as { kraPin?: string })?.kraPin);
    const tisName = String((cfg.config as { tisName?: string })?.tisName ?? "nPanel");
    const { salesDt, cfmDt } = kraNow();
    console.log(`retry on ${BASE} tin=${tin} cfmDt=${cfmDt}`);

    let parentQty = 20;
    let childQty = 20;
    for (const [label, itemCd, start] of [
        ["18 saveStockMaster parent", PARENT, parentQty],
        ["18b saveStockMaster child", CHILD, childQty],
    ] as const) {
        let rsdQty = start;
        let payload: Record<string, unknown> = { success: false };
        for (let i = 0; i < 6; i++) {
            payload = await call("POST", "etimsCert.stock.saveStockMaster", {
                stockMaster: { itemCd, rsdQty, ...AUDITOR },
            });
            if (payload.success === true) break;
            const next = expectedCounter(String(payload.errorMessage ?? ""));
            if (next == null || next === rsdQty) break;
            console.log(`  ${itemCd} rsdQty ${rsdQty} → ${next}`);
            rsdQty = next;
        }
        if (itemCd === PARENT) parentQty = rsdQty;
        else childQty = rsdQty;
        show(label, payload, `itemCd=${itemCd} rsdQty=${rsdQty}`);
    }

    const saleLine = {
        itemSeq: 1,
        itemCd: PARENT,
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

    function toKra12HourClock(stamp: string): string {
        const compact = stamp.replace(/\D/g, "");
        if (compact.length < 14) return stamp;
        const date = compact.slice(0, 8);
        let hh = Number(compact.slice(8, 10));
        const mmss = compact.slice(10, 14);
        if (hh === 0) hh = 12;
        else if (hh > 12) hh -= 12;
        return `${date}${String(hh).padStart(2, "0")}${mmss}`;
    }
    const rfdDt = toKra12HourClock(cfmDt);

    let cn: Record<string, unknown> = { success: false };
    cn = await call("POST", "etimsCert.sales.sendCreditNote", {
        transaction: {
            trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
            invcNo: 4,
            orgInvcNo: 3,
            custTin: tin,
            custNm: "Application Test Customer",
            salesTyCd: "N",
            rcptTyCd: "R",
            pmtTyCd: "01",
            salesSttsCd: "02",
            cfmDt: rfdDt,
            salesDt,
            stockRlsDt: rfdDt,
            rfdDt,
            rfdRsnCd: "06",
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
            remark: "OSCU verification credit note",
            ...AUDITOR,
            receipt: {
                custTin: tin,
                custMblNo: "0700000000",
                rcptPbctDt: rfdDt,
                trdeNm: tisName,
                adrs: "Nairobi",
                prchrAcptcYn: "N",
            },
            itemList: [saleLine],
        },
    });
    show("26 sendCreditNote", cn, `invcNo=4 org=3 rfdDt=${rfdDt}`);

    const saleStart = cn.success === true ? 5 : 4;
    let saleInvc = saleStart;
    let sale: Record<string, unknown> = { success: false };
    for (let i = 0; i < 8; i++) {
        sale = await call("POST", "etimsCert.sales.sendSalesTransaction", {
            transaction: {
                trdInvcNo: `NP${Date.now().toString().slice(-8)}`,
                invcNo: saleInvc,
                orgInvcNo: 0,
                custTin: tin,
                custNm: "Application Test Customer",
                salesTyCd: "N",
                rcptTyCd: "S",
                pmtTyCd: "01",
                salesSttsCd: "02",
                cfmDt,
                salesDt,
                stockRlsDt: cfmDt,
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
                remark: "OSCU verification sale",
                ...AUDITOR,
                receipt: {
                    custTin: tin,
                    custMblNo: "0700000000",
                    rcptPbctDt: cfmDt,
                    trdeNm: tisName,
                    adrs: "Nairobi",
                    prchrAcptcYn: "N",
                },
                itemList: [saleLine],
            },
        });
        const msg = String(sale.errorMessage ?? "");
        if (sale.success === true) break;
        const next = expectedCounter(msg);
        if (next != null && next !== saleInvc) {
            console.log(`  sale invcNo ${saleInvc} → expected ${next}`);
            saleInvc = next;
            continue;
        }
        if (/already exists/i.test(msg) && saleInvc < 20) {
            console.log(`  sale invcNo ${saleInvc} already exists → ${saleInvc + 1}`);
            saleInvc += 1;
            continue;
        }
        break;
    }
    show("15 sendSalesTransaction", sale, `invcNo=${saleInvc}`);
}

main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
