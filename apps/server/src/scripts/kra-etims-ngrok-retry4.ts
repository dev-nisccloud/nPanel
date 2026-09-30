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
    const lookup = await call("GET", "etimsCert.data.lookupCustomer", {
        custmTin: "P600004455A",
        lastReqDt: "20180101000000",
    });
    console.log("lookupCustomer", lookup.success, lookup.errorMessage ?? JSON.stringify(lookup.data).slice(0, 400));

    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const tin = String((cfg.config as { kraPin?: string })?.kraPin);
    const tisName = String((cfg.config as { tisName?: string })?.tisName ?? "nPanel");
    const rfdDt = "20260930025700";
    const cn = await call("POST", "etimsCert.sales.sendCreditNote", {
        transaction: {
            trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
            invcNo: 5,
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
    console.log("credit note invcNo=5", cn.success, cn.errorMessage ?? JSON.stringify(cn.data).slice(0, 400));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
