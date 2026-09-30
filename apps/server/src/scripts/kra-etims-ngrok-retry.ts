/**
 * Retry only the steps that failed on the first ngrok walk.
 */
const BASE = "https://loverlike-cinderella-signatureless.ngrok-free.dev";
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
    const res = await fetch(url, init);
    const json = JSON.parse(await res.text());
    return unwrap(json) as Record<string, unknown>;
}

function show(label: string, p: Record<string, unknown>) {
    console.log(
        `\n${label}\nsuccess=${p.success} error=${p.errorMessage ?? "-"}\n${JSON.stringify(p.data ?? p).slice(0, 800)}`,
    );
}

async function main() {
    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const config = (cfg.config ?? {}) as Record<string, unknown>;
    const tin = String(config.kraPin);
    const tisName = String(config.tisName ?? "nPanel");
    console.log(`kraPin=${tin} initialized=${cfg.isInitialized}`);

    show(
        "saveItem 0000003",
        await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd: "KE1NTBA0000003",
                itemClsCd: "1010150100",
                itemTyCd: "1",
                itemNm: "nPanel Cert VAT16 seq3",
                itemStdNm: "nPanel Cert VAT16 seq3",
                orgnNatCd: "KE",
                pkgUnitCd: "NT",
                qtyUnitCd: "BA",
                taxTyCd: "B",
                bcd: "NPB0003",
                dftPrc: 1000,
                grpPrcL1: 1000,
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        }),
    );

    show(
        "saveItem 0000004",
        await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd: "KE1NTBA0000004",
                itemClsCd: "1010150000",
                itemTyCd: "1",
                itemNm: "nPanel Cert Exempt seq4",
                itemStdNm: "nPanel Cert Exempt seq4",
                orgnNatCd: "KE",
                pkgUnitCd: "NT",
                qtyUnitCd: "BA",
                taxTyCd: "A",
                bcd: "NPA0004",
                dftPrc: 1000,
                grpPrcL1: 1000,
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        }),
    );

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

    const now = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(new Date());
    const g = (t: string) => now.find((p) => p.type === t)?.value ?? "00";
    const salesDt = `${g("year")}${g("month")}${g("day")}`;
    const cfmDt = `${salesDt}${g("hour") === "24" ? "00" : g("hour")}${g("minute")}${g("second")}`;

    show(
        "purchase invcNo 4",
        await call("POST", "etimsCert.purchases.sendPurchaseTransaction", {
            purchase: {
                spplrTin: tin,
                invcNo: 4,
                orgInvcNo: 0,
                spplrBhfId: "00",
                spplrNm: "Application Test Supplier",
                spplrInvcNo: 4,
                regTyCd: "M",
                pchsTyCd: "N",
                rcptTyCd: "P",
                pmtTyCd: "01",
                pchsSttsCd: "02",
                cfmDt,
                pchsDt: salesDt,
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
                remark: "purchase retry",
                ...AUDITOR,
                itemList: [line],
            },
        }),
    );

    show("lookupCustomer", await call("GET", "etimsCert.data.lookupCustomer", { custmTin: tin }));

    show(
        "credit note invcNo 7 org 3",
        await call("POST", "etimsCert.sales.sendCreditNote", {
            transaction: {
                trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
                invcNo: 7,
                orgInvcNo: 3,
                custTin: tin,
                custNm: "Application Test Customer",
                salesTyCd: "N",
                rcptTyCd: "R",
                pmtTyCd: "01",
                salesSttsCd: "02",
                cfmDt,
                salesDt,
                stockRlsDt: cfmDt,
                rfdDt: cfmDt,
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
                remark: "OSCU verification credit note retry",
                ...AUDITOR,
                receipt: {
                    custTin: tin,
                    custMblNo: "0700000000",
                    rcptPbctDt: cfmDt,
                    trdeNm: tisName,
                    adrs: "Nairobi",
                    prchrAcptcYn: "N",
                },
                itemList: [line],
            },
        }),
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
