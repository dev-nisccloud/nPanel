/**
 * Live ngrok probes for a real Gava 000 on SAVE SALES, then dump fiscal of invc 3.
 * Does not start a local server.
 */
const BASE = (process.env.ETIMS_CERT_NGROK_URL ?? "https://498a-197-232-51-43.ngrok-free.app").replace(/\/$/, "");
const tin = "P600005001A";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };

function unwrap(raw: unknown): unknown {
    const root = raw as Record<string, unknown>;
    const err = root?.error as Record<string, unknown> | undefined;
    if (err) throw new Error(String((err.data as { message?: string })?.message ?? err.message ?? JSON.stringify(err)));
    let cur: unknown = root?.result ?? root;
    if (cur && typeof cur === "object" && "data" in (cur as object)) cur = (cur as { data: unknown }).data;
    if (cur && typeof cur === "object" && "json" in (cur as object) && !("success" in (cur as object))) {
        cur = (cur as { json: unknown }).json;
    }
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
    const text = await res.text();
    let json: unknown = text;
    try {
        json = JSON.parse(text);
    } catch {
        return { success: false, errorMessage: `HTTP ${res.status}: ${text.slice(0, 400)}` };
    }
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

function pick(obj: unknown, key: string): string | null {
    const m = JSON.stringify(obj ?? {}).match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
    return m?.[1] ?? null;
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

function sale(extra: Record<string, unknown>, invcNo: number, items?: Array<Record<string, unknown>>) {
    const cfmDt = extra.cfmDt ?? "20261103120000";
    const salesDt = extra.salesDt ?? "20261103";
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
        remark: "force sale",
        ...AUDITOR,
        receipt: {
            custTin: tin,
            custMblNo: "0700000000",
            rcptPbctDt: cfmDt,
            trdeNm: "nPanel 7",
            adrs: "Nairobi",
            prchrAcptcYn: "N",
        },
        itemList: items ?? [
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
    console.log(`probe ${BASE}`);

    for (const n of [1, 2, 3, 4, 5, 8]) {
        const d = await call("GET", "etimsCert.sales.getInvoiceDetails", { invcNo: n });
        console.log(
            `invc ${n} success=${d.success} sdc=${pick(d, "sdcDateTime") ?? "-"} sign=${pick(d, "rcptSign") ?? "-"} cur=${pick(d, "curRcptNo") ?? "-"} items=${JSON.stringify(rowsOf(d, ["itemList"]).map((r) => r.itemCd)).slice(0, 200)}`,
        );
        if (n === 3 || n === 4) console.log(`  dump ${n}:`, JSON.stringify(d).slice(0, 1800));
    }

    const items = await call("GET", "etimsCert.items.getItemList", { lastReqDt: "20180101000000" });
    const itemRows = rowsOf(items, ["itemList"]);
    console.log(
        `items ${itemRows.length}:`,
        itemRows.map((r) => `${r.itemCd}/${r.qtyUnitCd}`).slice(0, 20).join(" "),
    );

    const codes = await call("GET", "etimsCert.data.getCodeList", { lastReqDt: "20180101000000" });
    const codeRows = rowsOf(codes, ["clsList", "cdList", "codeList"]);
    const qty = codeRows.filter((r) => String(r.cdCls ?? r.cdClsNm ?? "").toUpperCase().includes("QTY") || String(r.cdCls) === "10");
    const qtyHint = qty.length ? qty : codeRows.filter((r) => /XU|BA|NT|NO|OU/.test(String(r.cd ?? r.cdNm ?? "")));
    console.log("qty-ish codes", JSON.stringify(qtyHint.slice(0, 30)));

    const d4 = await call("GET", "etimsCert.sales.getInvoiceDetails", { invcNo: 4 });
    const d4Items = rowsOf(d4, ["itemList"]);
    console.log("invc4 itemList", JSON.stringify(d4Items).slice(0, 1500));

    for (const row of d4Items) {
        const itemCd = String(row.itemCd ?? "");
        if (!itemCd) continue;
        for (const qtyUnitCd of [String(row.qtyUnitCd ?? "BA"), "BA", "U", "NO", "OU", "NT", "G", "KG"]) {
            const saved = await call("POST", "etimsCert.items.saveItem", {
                item: {
                    itemCd,
                    itemClsCd: String(row.itemClsCd ?? "5059690800"),
                    itemTyCd: "1",
                    itemNm: String(row.itemNm ?? itemCd),
                    itemStdNm: String(row.itemNm ?? itemCd),
                    orgnNatCd: "KE",
                    pkgUnitCd: String(row.pkgUnitCd ?? "NT"),
                    qtyUnitCd,
                    taxTyCd: String(row.taxTyCd ?? "B"),
                    dftPrc: Number(row.prc ?? 1000),
                    isrcAplcbYn: "N",
                    useYn: "Y",
                    ...AUDITOR,
                },
            });
            if (show(`saveItem ${itemCd} qty=${qtyUnitCd}`, saved)) break;
        }
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const nairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
    const salesDt = `${nairobi.getFullYear()}${pad(nairobi.getMonth() + 1)}${pad(nairobi.getDate())}`;
    const cfm12 = `${salesDt}113000`;
    const cfmPast = "20261015120000";

    const cancelBodies = [
        { salesSttsCd: "03", cnclReqDt: cfm12, cnclDt: cfm12, remark: "cancel 03" },
        { salesSttsCd: "04", cnclReqDt: cfm12, cnclDt: cfm12, remark: "cancel 04" },
        { salesSttsCd: "03", cnclReqDt: cfmPast, cnclDt: cfmPast, salesDt: "20261015", cfmDt: cfmPast, remark: "cancel original day" },
    ];
    for (const extra of cancelBodies) {
        const p = await call("POST", "etimsCert.sales.sendSalesTransaction", {
            transaction: sale(
                extra,
                4,
                d4Items.length
                    ? d4Items.map((row, i) => ({
                          itemSeq: i + 1,
                          itemCd: row.itemCd,
                          itemClsCd: row.itemClsCd,
                          itemNm: row.itemNm,
                          pkgUnitCd: row.pkgUnitCd ?? "NT",
                          pkg: row.pkg ?? 1,
                          qtyUnitCd: row.qtyUnitCd ?? "BA",
                          qty: row.qty ?? 1,
                          prc: row.prc ?? 1160,
                          splyAmt: row.splyAmt ?? row.totAmt ?? 1160,
                          dcRt: row.dcRt ?? 0,
                          dcAmt: row.dcAmt ?? 0,
                          taxTyCd: row.taxTyCd ?? "B",
                          taxblAmt: row.taxblAmt ?? 1000,
                          taxAmt: row.taxAmt ?? 160,
                          totAmt: row.totAmt ?? 1160,
                      }))
                    : undefined,
            ),
        });
        if (show(`cancel4 ${extra.remark}`, p)) {
            const ns = await call("POST", "etimsCert.sales.sendSalesTransaction", {
                transaction: sale({ cfmDt: cfm12, salesDt }, 4),
            });
            if (show("fresh NS 4 after cancel", ns)) return;
        }
    }

    const variants: Array<[string, Record<string, unknown>, number]> = [
        ["NS 5", {}, 5],
        ["NS 4 today 11:30", { cfmDt: cfm12, salesDt, stockRlsDt: cfm12 }, 4],
        ["NS 1", {}, 1],
        ["CS copy invc3", { salesTyCd: "C", rcptTyCd: "S", orgInvcNo: 3, invcNo: 3 }, 3],
        ["PS proforma", { salesTyCd: "P" }, 4],
        ["TS training", { salesTyCd: "T" }, 4],
        ["NS no custTin", { custTin: null, custNm: "Walk-in" }, 4],
        ["NS pmt 02", { pmtTyCd: "02" }, 4],
        ["NS stts 01", { salesSttsCd: "01" }, 4],
        ["NS item 0000003", {}, 4],
    ];
    for (const [label, extra, invc] of variants) {
        const itemsOverride =
            label.includes("0000003")
                ? [
                      {
                          itemSeq: 1,
                          itemCd: "KE1NTBA0000003",
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
                  ]
                : undefined;
        const p = await call("POST", "etimsCert.sales.sendSalesTransaction", {
            transaction: sale(extra, invc, itemsOverride),
        });
        if (show(label, p)) return;
    }

    process.exitCode = 1;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
