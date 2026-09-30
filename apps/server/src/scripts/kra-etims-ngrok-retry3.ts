const BASE = "https://loverlike-cinderella-signatureless.ngrok-free.dev";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const line = {
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

function unwrap(raw: unknown): unknown {
    const root = raw as Record<string, unknown>;
    const err = root?.error as Record<string, unknown> | undefined;
    if (err) throw new Error(String((err.data as { message?: string })?.message ?? err.message));
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

async function main() {
    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const tin = String((cfg.config as { kraPin?: string })?.kraPin);
    const tisName = String((cfg.config as { tisName?: string })?.tisName ?? "nPanel");

    const purchase = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", {
        purchase: {
            spplrTin: tin,
            invcNo: 4,
            orgInvcNo: 0,
            spplrBhfId: "00",
            spplrNm: "Nisc Cloud Limited",
            spplrInvcNo: 3,
            regTyCd: "M",
            pchsTyCd: "N",
            rcptTyCd: "P",
            pmtTyCd: "01",
            pchsSttsCd: "02",
            cfmDt: "20260930145623",
            pchsDt: "20260930",
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
            remark: "purchase of queued supplier invc 3",
            ...AUDITOR,
            itemList: [line],
        },
    });
    console.log("purchase spplrInvcNo=3 invcNo=4", purchase.success, purchase.errorMessage ?? JSON.stringify(purchase.data).slice(0, 300));

    if (!purchase.success) {
        const m = String(purchase.errorMessage ?? "").match(/Expected:\s*(\d+)/i);
        if (m) {
            const invcNo = Number(m[1]);
            const retry = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", {
                purchase: {
                    spplrTin: tin,
                    invcNo,
                    orgInvcNo: 0,
                    spplrBhfId: "00",
                    spplrNm: "Nisc Cloud Limited",
                    spplrInvcNo: 3,
                    regTyCd: "M",
                    pchsTyCd: "N",
                    rcptTyCd: "P",
                    pmtTyCd: "01",
                    pchsSttsCd: "02",
                    cfmDt: "20260930145623",
                    pchsDt: "20260930",
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
                    remark: "purchase retry expected invcNo",
                    ...AUDITOR,
                    itemList: [line],
                },
            });
            console.log(`purchase retry invcNo=${invcNo}`, retry.success, retry.errorMessage ?? JSON.stringify(retry.data).slice(0, 300));
        }
    }

    // rfdDt: KRA parses with 12-hour clock (1-12). Sale sdc was 14:56:38.
    // Convert 14:57 → 02:57 on 12-hour clock, keep salesDt today.
    const stamps = ["20260930025700", "20260930120000", "20260930115638"];
    for (const rfdDt of stamps) {
        const cn = await call("POST", "etimsCert.sales.sendCreditNote", {
            transaction: {
                trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
                invcNo: 8,
                orgInvcNo: 3,
                custTin: tin,
                custNm: "Application Test Customer",
                salesTyCd: "N",
                rcptTyCd: "R",
                pmtTyCd: "01",
                salesSttsCd: "02",
                cfmDt: rfdDt,
                salesDt: "20260930",
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
                itemList: [line],
            },
        });
        console.log(`credit rfdDt=${rfdDt}`, cn.success, cn.errorMessage ?? JSON.stringify(cn.data).slice(0, 250));
        if (cn.success) break;
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
