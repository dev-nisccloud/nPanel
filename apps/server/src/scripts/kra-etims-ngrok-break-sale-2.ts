const BASE = "https://498a-197-232-51-43.ngrok-free.app";
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
    const msg = String(p.errorMessage ?? s.match(/"resultMsg"\s*:\s*"([^"]+)"/)?.[1] ?? "").slice(0, 260);
    const ok = p.success === true || cd === "000";
    console.log(`${ok ? "ok" : "FAIL"} ${label} cd=${cd} ${msg}`);
    return ok;
}

function rec(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstSale(payload: unknown): Record<string, unknown> | null {
    const walk = (v: unknown, depth: number): Record<string, unknown> | null => {
        if (depth > 10 || !v || typeof v !== "object") return null;
        const r = v as Record<string, unknown>;
        if (Array.isArray(r.salesList) && r.salesList[0]) return rec(r.salesList[0]);
        for (const k of ["data", "result", "responseBody", "json"]) {
            const n = walk(r[k], depth + 1);
            if (n) return n;
        }
        return null;
    };
    return walk(payload, 0);
}

function compactDt(v: unknown, fallback: string): string {
    const d = String(v ?? "").replace(/\D/g, "");
    if (d.length >= 14) return d.slice(0, 14);
    if (d.length === 8) return `${d}120000`;
    return fallback;
}

function expectedItemSeq(message: string): number | null {
    const m = message.match(/ending with:\s*\*+(\d+)/i);
    return m ? Number(m[1]) : null;
}

async function saveItem(item: Record<string, unknown>) {
    let itemCd = String(item.itemCd);
    for (let i = 0; i < 5; i++) {
        const p = await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd,
                itemClsCd: "1010150100",
                itemTyCd: String(itemCd).slice(2, 3) || "1",
                itemNm: String(item.itemNm ?? itemCd).slice(0, 200),
                itemStdNm: String(item.itemNm ?? itemCd).slice(0, 200),
                orgnNatCd: "KE",
                pkgUnitCd: String(itemCd).slice(3, 5),
                qtyUnitCd: String(itemCd).slice(5, 7),
                taxTyCd: item.taxTyCd ?? "B",
                bcd: null,
                dftPrc: Number(item.prc ?? 1000),
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        });
        if (show(`saveItem ${itemCd}`, p)) return true;
        const seq = expectedItemSeq(String(p.errorMessage ?? ""));
        if (seq == null) return false;
        itemCd = `${itemCd.replace(/\d+$/, "")}${String(seq).padStart(7, "0")}`;
    }
    return false;
}

async function main() {
    const d4 = await call("GET", "etimsCert.sales.getInvoiceDetails", { invcNo: 4 });
    const sale = firstSale(d4);
    if (!sale) throw new Error("no sale 4");
    const items = Array.isArray(sale.itemList) ? (sale.itemList as Record<string, unknown>[]) : [];
    console.log(
        "sale4 items",
        items.map((i) => `${i.itemSeq}:${i.itemCd} cls=${i.itemClsCd} tax=${i.taxTyCd} qty=${i.qty}`).join(" | "),
    );

    for (const item of items) {
        await saveItem(item);
        await call("POST", "etimsCert.stock.saveStockMaster", {
            stockMaster: { itemCd: item.itemCd, rsdQty: 20, ...AUDITOR },
        });
    }

    const cfm = compactDt(sale.cfmDt, "20261015124046");
    const salesDt = String(sale.salesDt ?? "20261015").replace(/\D/g, "").slice(0, 8);
    const receipt = rec(sale.receipt) ?? {};
    const base = {
        trdInvcNo: String(sale.trdInvcNo ?? `NP4${Date.now().toString().slice(-6)}`),
        invcNo: 4,
        orgInvcNo: 0,
        custTin: sale.custTin,
        custNm: sale.custNm,
        salesTyCd: sale.salesTyCd ?? "N",
        rcptTyCd: "S",
        pmtTyCd: sale.pmtTyCd ?? "01",
        cfmDt: cfm,
        salesDt,
        stockRlsDt: compactDt(sale.stockRlsDt, cfm),
        totItemCnt: items.length,
        taxblAmtA: Number(sale.taxblAmtA ?? 0),
        taxblAmtB: Number(sale.taxblAmtB ?? 0),
        taxblAmtC: Number(sale.taxblAmtC ?? 0),
        taxblAmtD: Number(sale.taxblAmtD ?? 0),
        taxblAmtE: Number(sale.taxblAmtE ?? 0),
        taxRtA: Number(sale.taxRtA ?? 0),
        taxRtB: Number(sale.taxRtB ?? 16),
        taxRtC: 0,
        taxRtD: Number(sale.taxRtD ?? 0),
        taxRtE: 0,
        taxAmtA: Number(sale.taxAmtA ?? 0),
        taxAmtB: Number(sale.taxAmtB ?? 0),
        taxAmtC: 0,
        taxAmtD: Number(sale.taxAmtD ?? 0),
        taxAmtE: 0,
        totTaxblAmt: Number(sale.totTaxblAmt ?? 0),
        totTaxAmt: Number(sale.totTaxAmt ?? 0),
        totAmt: Number(sale.totAmt ?? 0),
        prchrAcptcYn: "N",
        ...AUDITOR,
        receipt: {
            custTin: receipt.custTin ?? sale.custTin,
            custMblNo: receipt.custMblNo ?? "0700000000",
            rcptPbctDt: compactDt(receipt.rcptPbctDt, cfm),
            trdeNm: receipt.trdeNm ?? "nPanel 7",
            adrs: receipt.adrs ?? "Nairobi",
            topMsg: receipt.topMsg ?? "Shop with us",
            btmMsg: receipt.btmMsg ?? "Welcome Again",
            prchrAcptcYn: "N",
        },
        itemList: items.map((i, idx) => ({
            itemSeq: Number(i.itemSeq ?? idx + 1),
            itemCd: i.itemCd,
            itemClsCd: "1010150100",
            itemNm: i.itemNm,
            pkgUnitCd: i.pkgUnitCd ?? "NT",
            pkg: Number(i.pkg ?? 1),
            qtyUnitCd: i.qtyUnitCd ?? "BA",
            qty: Number(i.qty ?? 1),
            prc: Number(i.prc ?? 0),
            splyAmt: Number(i.splyAmt ?? 0),
            dcRt: Number(i.dcRt ?? 0),
            dcAmt: Number(i.dcAmt ?? 0),
            taxTyCd: i.taxTyCd ?? "B",
            taxblAmt: Number(i.taxblAmt ?? 0),
            taxAmt: Number(i.taxAmt ?? 0),
            totAmt: Number(i.totAmt ?? 0),
        })),
    };

    if (show("replay invc4 after saveItem", await call("POST", "etimsCert.sales.sendSalesTransaction", { transaction: { ...base, salesSttsCd: "02", remark: "replay after item save" } }))) {
        return;
    }
    show(
        "cancel 03",
        await call("POST", "etimsCert.sales.sendSalesTransaction", {
            transaction: { ...base, salesSttsCd: "03", cnclReqDt: "20261103120000", remark: "cancel 03" },
        }),
    );
    show(
        "cancel 04",
        await call("POST", "etimsCert.sales.sendSalesTransaction", {
            transaction: {
                ...base,
                salesSttsCd: "04",
                cnclReqDt: "20261103120000",
                cnclDt: "20261103120000",
                remark: "cancel 04",
            },
        }),
    );

    const tin = "P600005001A";
    const ns = {
        trdInvcNo: `NP${Date.now().toString().slice(-8)}`,
        invcNo: 4,
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
        remark: "NS after cancel 4",
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
    };
    if (show("fresh NS 4", await call("POST", "etimsCert.sales.sendSalesTransaction", { transaction: ns }))) return;

    const cn = {
        ...ns,
        trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
        orgInvcNo: 3,
        rcptTyCd: "R",
        rfdDt: "20261103120000",
        rfdRsnCd: "06",
        remark: "CN after cancel 4",
    };
    show("CN 4 org3", await call("POST", "etimsCert.sales.sendCreditNote", { transaction: cn }));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
