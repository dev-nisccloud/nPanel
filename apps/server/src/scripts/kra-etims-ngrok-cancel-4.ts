/**
 * Cancel Gava invcNo 4 using the exact original lines (qtyUnitCd=U, XU itemCds).
 * If that frees the counter, post a fresh NS 4 with KE1NTBA0000001.
 */
const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");

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
    const msg = String(p.errorMessage ?? s.match(/"resultMsg"\s*:\s*"([^"]+)"/)?.[1] ?? "").slice(0, 300);
    const ok = p.success === true || cd === "000";
    console.log(`${ok ? "ok" : "FAIL"} ${label} cd=${cd} ${msg}`);
    return ok;
}

const items = [
    {
        itemSeq: 1,
        itemCd: "KE1NTXU1000005",
        itemClsCd: "5059690800",
        itemNm: "Product-B-5",
        pkgUnitCd: "NT",
        pkg: 1,
        qtyUnitCd: "U",
        qty: 1,
        prc: 2530.51,
        splyAmt: 2181,
        dcRt: 0,
        dcAmt: 0,
        taxTyCd: "B",
        taxblAmt: 2181,
        taxAmt: 349.51,
        totAmt: 2530.51,
    },
    {
        itemSeq: 2,
        itemCd: "KE1NTXU1000002",
        itemClsCd: "5059690800",
        itemNm: "Product-B-2",
        pkgUnitCd: "NT",
        pkg: 1,
        qtyUnitCd: "U",
        qty: 1,
        prc: 2788.77,
        splyAmt: 2404,
        dcRt: 0,
        dcAmt: 0,
        taxTyCd: "B",
        taxblAmt: 2404,
        taxAmt: 384.77,
        totAmt: 2788.77,
    },
];

function body(extra: Record<string, unknown>) {
    return {
        trdInvcNo: "AUTO-4",
        invcNo: 4,
        orgInvcNo: 0,
        custTin: "P600005019A",
        custNm: "Automated Test Customer",
        salesTyCd: "N",
        rcptTyCd: "S",
        pmtTyCd: "01",
        salesSttsCd: "02",
        cfmDt: "20261015034046",
        salesDt: "20261015",
        stockRlsDt: "20261015034046",
        totItemCnt: 2,
        taxblAmtA: 0,
        taxblAmtB: 4585,
        taxblAmtC: 0,
        taxblAmtD: 0,
        taxblAmtE: 0,
        taxRtA: 0,
        taxRtB: 16,
        taxRtC: 0,
        taxRtD: 0,
        taxRtE: 0,
        taxAmtA: 0,
        taxAmtB: 734.28,
        taxAmtC: 0,
        taxAmtD: 0,
        taxAmtE: 0,
        totTaxblAmt: 4585,
        totTaxAmt: 734.28,
        totAmt: 5319.28,
        prchrAcptcYn: "N",
        remark: "Completed by Automated User",
        regrId: "Automated User",
        regrNm: "Automated User",
        modrId: "Automated User",
        modrNm: "Automated User",
        receipt: {
            custTin: "P600005019A",
            custMblNo: "0700000000",
            rcptPbctDt: "20261015034046",
            trdeNm: "nPanel 7",
            adrs: "Nairobi",
            topMsg: "Shop with us",
            btmMsg: "Welcome Again",
            prchrAcptcYn: "N",
        },
        itemList: items,
        ...extra,
    };
}

const ns = {
    trdInvcNo: `NP${Date.now().toString().slice(-8)}`,
    invcNo: 4,
    orgInvcNo: 0,
    custTin: "P600005001A",
    custNm: "Application Test Customer",
    salesTyCd: "N",
    rcptTyCd: "S",
    pmtTyCd: "01",
    salesSttsCd: "02",
    cfmDt: "20261103113000",
    salesDt: "20261103",
    stockRlsDt: "20261103113000",
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
    regrId: "Admin",
    regrNm: "Admin",
    modrId: "Admin",
    modrNm: "Admin",
    receipt: {
        custTin: "P600005001A",
        custMblNo: "0700000000",
        rcptPbctDt: "20261103113000",
        trdeNm: "nPanel 7",
        adrs: "Nairobi",
        prchrAcptcYn: "N",
    },
    itemList: [
        {
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
        },
    ],
};

async function main() {
    const attempts: Array<[string, Record<string, unknown>]> = [
        ["cancel 03 exact", { salesSttsCd: "03", cnclReqDt: "20261015034100", cnclDt: "20261015034100" }],
        ["cancel 04 exact", { salesSttsCd: "04", cnclReqDt: "20261015034100", cnclDt: "20261015034100" }],
        ["cancel 03 today 11:30", { salesSttsCd: "03", cnclReqDt: "20261103113000", cnclDt: "20261103113000", cfmDt: "20261103113000", stockRlsDt: "20261103113000", salesDt: "20261103" }],
        ["copy CS invc4 org0", { salesTyCd: "C", rcptTyCd: "S", orgInvcNo: 0 }],
        ["copy CS invc4 org4", { salesTyCd: "C", rcptTyCd: "S", orgInvcNo: 4, invcNo: 4 }],
        ["NS exact replay", {}],
    ];
    for (const [label, extra] of attempts) {
        const p = await call("POST", "etimsCert.sales.sendSalesTransaction", { transaction: body(extra) });
        if (show(label, p)) {
            const fresh = await call("POST", "etimsCert.sales.sendSalesTransaction", { transaction: ns });
            if (show("fresh NS 4", fresh)) return;
        }
    }
    process.exitCode = 1;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
