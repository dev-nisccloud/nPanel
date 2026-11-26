const BASE = "https://498a-197-232-51-43.ngrok-free.app";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };
const tin = "P600005001A";

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
    const msg = String(p.errorMessage ?? s.match(/"resultMsg"\s*:\s*"([^"]+)"/)?.[1] ?? "").slice(0, 240);
    const ok = p.success === true || cd === "000";
    console.log(`${ok ? "ok" : "FAIL"} ${label} cd=${cd} ${msg}`);
    return ok;
}

function saleBody(extra: Record<string, unknown>, invcNo: number) {
    return {
        trdInvcNo: `NP${Date.now().toString().slice(-8)}${invcNo}`,
        invcNo,
        orgInvcNo: 0,
        custTin: tin,
        custNm: "Application Test Customer",
        salesTyCd: "N",
        rcptTyCd: "S",
        pmtTyCd: "01",
        salesSttsCd: "02",
        cfmDt: "20261103120000",
        salesDt: "20261103",
        stockRlsDt: "20261103120000",
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
        remark: "bhf loophole",
        ...AUDITOR,
        receipt: {
            custTin: tin,
            custMblNo: "0700000000",
            rcptPbctDt: "20261103120000",
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
        ...extra,
    };
}

async function main() {
    const branches = await call("GET", "etimsCert.branch.getBranchList", { lastReqDt: "20180101000000" });
    console.log("branches", JSON.stringify(branches).slice(0, 800));

    const bhfIds = ["00", "01", "02", "000", "99", "10"];
    const invcs = [1, 4];
    for (const bhfId of bhfIds) {
        for (const invcNo of invcs) {
            const p = await call("POST", "etimsCert.sales.sendSalesTransaction", {
                transaction: saleBody({ bhfId }, invcNo),
            });
            if (show(`NS bhfId=${bhfId} invc=${invcNo}`, p)) return;
        }
    }

    for (const [pkg, qty] of [
        ["NT", "XU"],
        ["NT", "U"],
        ["NT", "NO"],
        ["NT", "OU"],
        ["NT", "BA"],
    ] as const) {
        const itemCd = `KE1${pkg}${qty}1000005`;
        const saved = await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd,
                itemClsCd: "1010150100",
                itemTyCd: "1",
                itemNm: "xu clone",
                itemStdNm: "xu clone",
                orgnNatCd: "KE",
                pkgUnitCd: pkg,
                qtyUnitCd: qty,
                taxTyCd: "B",
                dftPrc: 1000,
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        });
        show(`saveItem ${itemCd}`, saved);
    }

    const xu = await call("POST", "etimsCert.items.saveItem", {
        item: {
            itemCd: "KE1NTXU1000005",
            itemClsCd: "1010150100",
            itemTyCd: "1",
            itemNm: "xu 5",
            itemStdNm: "xu 5",
            orgnNatCd: "KE",
            pkgUnitCd: "NT",
            qtyUnitCd: "XU",
            taxTyCd: "B",
            dftPrc: 1000,
            isrcAplcbYn: "N",
            useYn: "Y",
            ...AUDITOR,
        },
    });
    show("saveItem KE1NTXU1000005 qty=XU", xu);

    process.exitCode = 1;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
