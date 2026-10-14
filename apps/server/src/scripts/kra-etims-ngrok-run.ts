/**
 * Walk docs/kra-etims-oscu-postman-verification.md against the ngrok etimsCert tree.
 *
 *   bun run src/scripts/kra-etims-ngrok-run.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://loverlike-cinderella-signatureless.ngrok-free.dev";
const LAST = "20180101000000";
const PARENT = "KE1NTBA0000001";
const CHILD = "KE1NTBA0000002";
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };

const NAIROBI = "Africa/Nairobi";
function kraParts(d = new Date()) {
    const list = new Intl.DateTimeFormat("en-GB", {
        timeZone: NAIROBI,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(d);
    const g = (t: string) => list.find((p) => p.type === t)?.value ?? "00";
    const hh = g("hour") === "24" ? "00" : g("hour");
    return { y: g("year"), m: g("month"), d: g("day"), hh, mm: g("minute"), ss: g("second") };
}
function kraDate(d = new Date()) {
    const p = kraParts(d);
    return `${p.y}${p.m}${p.d}`;
}
function kraDateTime(d = new Date()) {
    const p = kraParts(d);
    return `${p.y}${p.m}${p.d}${p.hh}${p.mm}${p.ss}`;
}
function addSeconds(stamp: string, seconds: number) {
    const y = stamp.slice(0, 4);
    const m = stamp.slice(4, 6);
    const d = stamp.slice(6, 8);
    const hh = stamp.slice(8, 10);
    const mm = stamp.slice(10, 12);
    const ss = stamp.slice(12, 14);
    const dt = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}+03:00`);
    return kraDateTime(new Date(dt.getTime() + seconds * 1000));
}

function unwrap(raw: unknown): unknown {
    if (!raw || typeof raw !== "object") return raw;
    const root = raw as Record<string, unknown>;
    const err = root.error as Record<string, unknown> | undefined;
    if (err) {
        const data = err.data as Record<string, unknown> | undefined;
        throw new Error(String(data?.message ?? err.message ?? JSON.stringify(err)));
    }
    let cur: unknown = root.result ?? root;
    if (cur && typeof cur === "object" && "data" in (cur as object)) {
        cur = (cur as { data: unknown }).data;
    }
    if (cur && typeof cur === "object" && "json" in (cur as object) && !("success" in (cur as object))) {
        cur = (cur as { json: unknown }).json;
    }
    return cur;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function resultCdOf(payload: unknown): string | null {
    const walk = (v: unknown, depth: number): string | null => {
        if (depth > 6 || !v || typeof v !== "object") return null;
        const r = v as Record<string, unknown>;
        if (typeof r.resultCd === "string" && r.resultCd) return r.resultCd;
        for (const k of ["data", "responseBody", "info"]) {
            const nested = walk(r[k], depth + 1);
            if (nested) return nested;
        }
        return null;
    };
    return walk(payload, 0);
}

function resultMsgOf(payload: unknown): string {
    const r = asRecord(payload);
    if (!r) return "";
    const inner = asRecord(r.data) ?? r;
    return String(inner.resultMsg ?? r.errorMessage ?? r.resultMsg ?? "");
}

function isPass(cd: string | null, success?: unknown) {
    if (success === true) return true;
    return cd === "000" || cd === "001" || cd === "902";
}

function isEmptyLookup(payload: unknown): boolean {
    const rec = asRecord(payload);
    const msg = String(rec?.errorMessage ?? resultMsgOf(payload) ?? "");
    const cd = resultCdOf(payload);
    return cd === "001" || /no search result/i.test(msg);
}

function nestedRows(payload: unknown, keys: string[]): Array<Record<string, unknown>> {
    const walk = (v: unknown, depth: number): unknown[] => {
        if (depth > 8 || !v || typeof v !== "object") return [];
        const r = v as Record<string, unknown>;
        for (const k of keys) {
            if (Array.isArray(r[k])) return r[k] as unknown[];
        }
        for (const k of ["data", "responseBody", "json"]) {
            const n = walk(r[k], depth + 1);
            if (n.length) return n;
        }
        return [];
    };
    return walk(payload, 0).map(asRecord).filter((row): row is Record<string, unknown> => Boolean(row));
}

function expectedCounter(message: string): number | null {
    const m = message.match(/Expected:\s*(\d+)\s+but\s+found/i);
    return m ? Number(m[1]) : null;
}

function pickCls(list: Array<Record<string, unknown>>, tax: string, fallback: string) {
    const usable = list.filter((r) => r.useYn !== "N" && String(r.itemClsCd ?? "").length >= 8);
    const exact = usable.filter((r) => String(r.taxTyCd ?? "").toUpperCase() === tax);
    const pool = exact.length ? exact : usable;
    const leaf = pool.find((r) => String(r.itemClsCd).length === 10) ?? pool[0];
    return String(leaf?.itemClsCd ?? fallback);
}

function fiscalOf(payload: unknown): { sdcDateTime: string | null; rcptSign: string | null; intrlData: string | null } {
    const walk = (v: unknown, depth: number): Record<string, unknown> | null => {
        if (depth > 8 || !v || typeof v !== "object") return null;
        const r = v as Record<string, unknown>;
        if (typeof r.sdcDateTime === "string" || typeof r.rcptSign === "string") return r;
        for (const k of ["data", "responseBody", "info"]) {
            const n = walk(r[k], depth + 1);
            if (n) return n;
        }
        return null;
    };
    const f = walk(payload, 0);
    return {
        sdcDateTime: typeof f?.sdcDateTime === "string" ? f.sdcDateTime : null,
        rcptSign: typeof f?.rcptSign === "string" ? f.rcptSign : null,
        intrlData: typeof f?.intrlData === "string" ? f.intrlData : null,
    };
}

function firstImport(payload: unknown): Record<string, unknown> | null {
    const rows = nestedRows(payload, ["itemList"]);
    return rows.find((row) => row.taskCd && String(row.imptItemsttsCd ?? "2") !== "3") ?? rows.find((row) => row.taskCd) ?? null;
}

function queuedPurchases(payload: unknown): Array<Record<string, unknown>> {
    return nestedRows(payload, ["saleList", "pchsList", "itemList"]).filter((row) => row.spplrInvcNo != null);
}

async function call(method: "GET" | "POST", procedure: string, input?: unknown): Promise<unknown> {
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
        throw new Error(`${procedure} HTTP ${res.status}: ${text.slice(0, 400)}`);
    }
    try {
        return unwrap(json);
    } catch (e) {
        throw new Error(`${procedure}: ${e instanceof Error ? e.message : String(e)}`);
    }
}

async function lookupUntilRows(
    procedure: string,
    input: unknown,
    extract: (payload: unknown) => unknown[],
): Promise<unknown> {
    let payload: unknown = await call("GET", procedure, input);
    for (let i = 0; i < 4 && extract(payload).length === 0; i++) {
        await Bun.sleep(1500);
        payload = await call("GET", procedure, input);
    }
    return payload;
}

function sessionCmcKey(): string | null {
    const p = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.etims-certification/session.json");
    if (!existsSync(p)) return null;
    try {
        const parsed = JSON.parse(readFileSync(p, "utf8")) as { cmcKey?: string };
        return parsed.cmcKey?.trim() || null;
    } catch {
        return null;
    }
}

async function main() {
    const salesDt = kraDate();
    const cfmDt = kraDateTime();
    const log: Array<{ step: string; ok: boolean; cd: string | null; detail: string }> = [];
    const rec = (step: string, payload: unknown, extra = "") => {
        const recObj = asRecord(payload);
        const cd = resultCdOf(payload);
        const ok =
            isPass(cd, recObj?.success) ||
            isEmptyLookup(payload) ||
            recObj?.isInitialized === true ||
            recObj?.usesDatabase === false;
        const detail = [extra, resultMsgOf(payload) || (recObj?.errorMessage ? String(recObj.errorMessage) : "")]
            .filter(Boolean)
            .join(" | ");
        log.push({ step, ok: Boolean(ok || (cd && isPass(cd))), cd, detail });
        const mark = log[log.length - 1]!.ok ? "ok" : "FAIL";
        console.log(`${mark.padEnd(4)} ${step.padEnd(42)} cd=${cd ?? "-"} ${detail}`.trim());
        return payload;
    };

    const cfg = (await call("GET", "etimsCert.auth.getConfiguration")) as Record<string, unknown>;
    const config = asRecord(cfg.config) ?? {};
    const tin = String(config.kraPin ?? "");
    const tisName = String(config.tisName ?? "nPanel");
    rec("0 getConfiguration", cfg, `kraPin=${tin} serial=${config.deviceSerialNumber} db=${cfg.usesDatabase}`);
    if (!tin) throw new Error("getConfiguration returned no kraPin — is ngrok hitting this API?");
    console.log(`  using tin=${tin} tis=${tisName}`);

    let init = (await call("POST", "etimsCert.initialization.initializeDevice", {})) as Record<string, unknown>;
    rec("1 initializeDevice {}", init, `tin=${init.tin} reused=${init.reusedExistingCmcKey}`);
    if (init.success !== true) {
        const stored = sessionCmcKey();
        if (stored && resultCdOf(init) === "901") {
            throw new Error("Init 901 — env PIN/serial still not a KRA pair. Restart API after env change.");
        }
        if (stored) {
            console.log("  902 with no key — posting cert-local cmcKey (value not logged)");
            init = (await call("POST", "etimsCert.initialization.initializeDevice", { cmcKey: stored })) as Record<string, unknown>;
            rec("1 initializeDevice +cmcKey", init, `reused=${init.reusedExistingCmcKey}`);
        }
    }
    if (init.success !== true) {
        throw new Error(`Init did not succeed: ${init.errorMessage ?? resultMsgOf(init)}`);
    }

    const last = { lastReqDt: LAST };
    rec("2 getCodeList", await call("GET", "etimsCert.data.getCodeList", last));

    const clsPayload = await call("GET", "etimsCert.data.getItemClassList", last);
    rec("3 getItemClassList", clsPayload);
    const clsRows: Array<Record<string, unknown>> = [];
    const collect = (v: unknown, depth: number) => {
        if (depth > 8 || !v || typeof v !== "object") return;
        const r = v as Record<string, unknown>;
        if (Array.isArray(r.itemClsList)) {
            for (const row of r.itemClsList) {
                const x = asRecord(row);
                if (x) clsRows.push(x);
            }
        }
        for (const k of ["data", "responseBody"]) collect(r[k], depth + 1);
    };
    collect(clsPayload, 0);
    const clsB = pickCls(clsRows, "B", "1010150100");
    const clsA = pickCls(clsRows, "A", "1010150000");
    console.log(`  clsB=${clsB} clsA=${clsA}`);

    rec("4 getBranchList", await call("GET", "etimsCert.branch.getBranchList", last));
    rec("5 getNotices", await call("GET", "etimsCert.data.getNotices", last));

    rec(
        "6 saveCustomer",
        await call("POST", "etimsCert.branch.saveCustomer", {
            customer: {
                custNo: "CUST001",
                custTin: tin,
                custNm: "Application Test Customer",
                adrs: "Nairobi",
                telNo: "0700000000",
                email: "cert@nisccloud.com",
                useYn: "Y",
                remark: "OSCU verification",
                ...AUDITOR,
            },
        }),
    );
    rec(
        "7 saveBranchUser",
        await call("POST", "etimsCert.branch.saveBranchUser", {
            user: {
                userId: "npuser01",
                userNm: "nPanel Cert User",
                pwd: "CertPass123!",
                adrs: "Nairobi",
                cntc: "0700000001",
                authCd: "1",
                remark: "OSCU verification",
                useYn: "Y",
                ...AUDITOR,
            },
        }),
    );
    rec(
        "8 saveBranchInsurance",
        await call("POST", "etimsCert.branch.saveBranchInsurance", {
            insurance: {
                isrccCd: "ISRCC01",
                isrccNm: "Test Insurance Co",
                isrcRt: 10,
                useYn: "Y",
                ...AUDITOR,
            },
        }),
    );
    rec(
        "9 getItemList",
        await lookupUntilRows("etimsCert.items.getItemList", last, (p) => nestedRows(p, ["itemList"])),
    );

    rec(
        "10 saveItem parent B",
        await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd: PARENT,
                itemClsCd: clsB,
                itemTyCd: "1",
                itemNm: "nPanel Cert VAT16",
                itemStdNm: "nPanel Cert VAT16",
                orgnNatCd: "KE",
                pkgUnitCd: "NT",
                qtyUnitCd: "BA",
                taxTyCd: "B",
                bcd: "NPB0001",
                dftPrc: 1000,
                grpPrcL1: 1000,
                grpPrcL2: 1000,
                grpPrcL3: 1000,
                grpPrcL4: 1000,
                grpPrcL5: 0,
                sftyQty: 0,
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        }),
    );
    rec(
        "10b saveItem child A",
        await call("POST", "etimsCert.items.saveItem", {
            item: {
                itemCd: CHILD,
                itemClsCd: clsA,
                itemTyCd: "1",
                itemNm: "nPanel Cert Exempt",
                itemStdNm: "nPanel Cert Exempt",
                orgnNatCd: "KE",
                pkgUnitCd: "NT",
                qtyUnitCd: "BA",
                taxTyCd: "A",
                bcd: "NPA0002",
                dftPrc: 1000,
                grpPrcL1: 1000,
                grpPrcL2: 1000,
                grpPrcL3: 1000,
                grpPrcL4: 1000,
                grpPrcL5: 0,
                sftyQty: 0,
                isrcAplcbYn: "N",
                useYn: "Y",
                ...AUDITOR,
            },
        }),
    );

    rec(
        "11 sendStockIO",
        await call("POST", "etimsCert.stock.sendStockIO", {
            stockData: {
                sarNo: 1,
                orgSarNo: 0,
                regTyCd: "M",
                sarTyCd: "06",
                ocrnDt: salesDt,
                totItemCnt: 2,
                totTaxblAmt: 20000,
                totTaxAmt: 1600,
                totAmt: 21600,
                remark: "stock in for composition",
                ...AUDITOR,
                itemList: [
                    {
                        itemSeq: 1,
                        itemCd: PARENT,
                        itemClsCd: clsB,
                        itemNm: "nPanel Cert VAT16",
                        pkgUnitCd: "NT",
                        pkg: 1,
                        qtyUnitCd: "BA",
                        qty: 10,
                        prc: 1160,
                        splyAmt: 11600,
                        totDcAmt: 0,
                        taxblAmt: 10000,
                        taxTyCd: "B",
                        taxAmt: 1600,
                        totAmt: 11600,
                    },
                    {
                        itemSeq: 2,
                        itemCd: CHILD,
                        itemClsCd: clsA,
                        itemNm: "nPanel Cert Exempt",
                        pkgUnitCd: "NT",
                        pkg: 1,
                        qtyUnitCd: "BA",
                        qty: 10,
                        prc: 1000,
                        splyAmt: 10000,
                        totDcAmt: 0,
                        taxblAmt: 10000,
                        taxTyCd: "A",
                        taxAmt: 0,
                        totAmt: 10000,
                    },
                ],
            },
        }),
    );

    rec(
        "12 saveItemComposition",
        await call("POST", "etimsCert.items.saveItemComposition", {
            composition: { itemCd: PARENT, cpstItemCd: CHILD, cpstQty: 1, ...AUDITOR },
        }),
    );

    const imports = await lookupUntilRows("etimsCert.imports.getImportedItems", last, (p) =>
        nestedRows(p, ["itemList"]).filter((row) => row.taskCd),
    );
    rec("13 getImportedItems", imports);
    const importRow = firstImport(imports);
    if (importRow) {
        rec(
            "14 confirmImportedItem",
            await call("POST", "etimsCert.imports.confirmImportedItem", {
                item: {
                    taskCd: String(importRow.taskCd),
                    dclDe: String(importRow.dclDe),
                    itemSeq: Number(importRow.itemSeq ?? 1),
                    hsCd: String(importRow.hsCd),
                    itemClsCd: clsB,
                    itemCd: PARENT,
                    imptItemSttsCd: "3",
                    modrId: "Admin",
                    modrNm: "Admin",
                    remark: "OSCU verification convert",
                },
            }),
        );
    } else {
        log.push({ step: "14 confirmImportedItem", ok: true, cd: "001", detail: "skipped — no imported rows" });
        console.log("ok   14 confirmImportedItem                        skipped (empty)");
    }

    const saleLine = {
        itemSeq: 1,
        itemCd: PARENT,
        itemClsCd: clsB,
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

    let saleInvc = 1;
    let salePayload: unknown = null;
    for (let i = 0; i < 8; i++) {
        const body = {
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
        };
        salePayload = await call("POST", "etimsCert.sales.sendSalesTransaction", body);
        const recObj = asRecord(salePayload);
        if (recObj?.success === true || isPass(resultCdOf(salePayload))) break;
        const next = expectedCounter(String(recObj?.errorMessage ?? resultMsgOf(salePayload)));
        if (next == null || next === saleInvc) break;
        console.log(`  sale invcNo ${saleInvc} rejected, retry ${next}`);
        saleInvc = next;
    }
    const fiscal = fiscalOf(salePayload);
    rec("15 sendSalesTransaction", salePayload, `invcNo=${saleInvc} sdc=${fiscal.sdcDateTime ?? "-"}`);

    const purchaseList = await lookupUntilRows("etimsCert.purchases.getPurchaseTransactions", last, queuedPurchases);
    rec("16 getPurchaseTransactions", purchaseList);
    const queued = queuedPurchases(purchaseList);

    let pInvc = saleInvc + 1;
    if (!queued.length) {
        rec("17 sendPurchaseTransaction", { success: false, errorMessage: "no queued supplier invoice" }, "need a saleList row");
    }
    for (let n = 0; n < queued.length; n++) {
        const row = queued[n]!;
        const spplrInvcNo = Number(row.spplrInvcNo);
        const itemList = Array.isArray(row.itemList) && row.itemList.length ? row.itemList : [saleLine];
        let payload: unknown = null;
        for (let i = 0; i < 6; i++) {
            payload = await call("POST", "etimsCert.purchases.sendPurchaseTransaction", {
                purchase: {
                    spplrTin: String(row.spplrTin ?? tin),
                    invcNo: pInvc,
                    orgInvcNo: 0,
                    spplrBhfId: String(row.spplrBhfId ?? "00"),
                    spplrNm: String(row.spplrNm ?? "Application Test Supplier"),
                    spplrInvcNo,
                    regTyCd: "M",
                    pchsTyCd: "N",
                    rcptTyCd: "P",
                    pmtTyCd: String(row.pmtTyCd ?? "01"),
                    pchsSttsCd: "02",
                    cfmDt,
                    pchsDt: salesDt,
                    wrhsDt: null,
                    cnclReqDt: null,
                    cnclDt: null,
                    rfdDt: null,
                    totItemCnt: itemList.length,
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
                    remark: `purchase of supplier invc ${spplrInvcNo}`,
                    ...AUDITOR,
                    itemList,
                },
            });
            const recObj = asRecord(payload);
            if (recObj?.success === true || isPass(resultCdOf(payload))) break;
            const next = expectedCounter(String(recObj?.errorMessage ?? resultMsgOf(payload)));
            if (next == null || next === pInvc) break;
            console.log(`  purchase invcNo ${pInvc} rejected, retry ${next}`);
            pInvc = next;
        }
        rec(`17 sendPurchaseTransaction #${n + 1}`, payload, `invcNo=${pInvc} spplrInvcNo=${spplrInvcNo}`);
        pInvc += 1;
    }

    rec(
        "18 saveStockMaster parent",
        await call("POST", "etimsCert.stock.saveStockMaster", {
            stockMaster: { itemCd: PARENT, rsdQty: 10, ...AUDITOR },
        }),
    );
    rec(
        "18b saveStockMaster child",
        await call("POST", "etimsCert.stock.saveStockMaster", {
            stockMaster: { itemCd: CHILD, rsdQty: 10, ...AUDITOR },
        }),
    );

    rec("19 getStockMovements", await call("GET", "etimsCert.stock.getStockMovements", last));
    rec("20 getInvoiceDetails", await call("GET", "etimsCert.sales.getInvoiceDetails", { invcNo: saleInvc }));
    rec("21 getSalesTransactions", await call("GET", "etimsCert.sales.getSalesTransactions", last));
    rec("22 getCustomerList", await call("GET", "etimsCert.data.getCustomerList", last));
    rec("23 getTaxPayerInfo", await call("GET", "etimsCert.data.getTaxPayerInfo", last));
    rec("24 lookupCustomer", await call("GET", "etimsCert.data.lookupCustomer", { custmTin: tin }));
    rec("25 getNoticeList", await call("GET", "etimsCert.data.getNoticeList", last));

    const originalSdc = fiscal.sdcDateTime ?? cfmDt;
    let rfdDt = kraDateTime();
    if (rfdDt <= originalSdc) rfdDt = addSeconds(originalSdc, 60);
    let cnInvc = pInvc;
    let cnPayload: unknown = null;
    for (let i = 0; i < 6; i++) {
        cnPayload = await call("POST", "etimsCert.sales.sendCreditNote", {
            transaction: {
                trdInvcNo: `NPCN${Date.now().toString().slice(-6)}`,
                invcNo: cnInvc,
                orgInvcNo: saleInvc,
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
        const recObj = asRecord(cnPayload);
        if (recObj?.success === true || isPass(resultCdOf(cnPayload))) break;
        const next = expectedCounter(String(recObj?.errorMessage ?? resultMsgOf(cnPayload)));
        if (next == null || next === cnInvc) break;
        console.log(`  credit note invcNo ${cnInvc} rejected, retry ${next}`);
        cnInvc = next;
    }
    rec("26 sendCreditNote", cnPayload, `invcNo=${cnInvc} org=${saleInvc} rfdDt=${rfdDt}`);

    const failed = log.filter((r) => !r.ok);
    console.log("\n═══ summary ═══");
    console.log(`${log.filter((r) => r.ok).length}/${log.length} passed`);
    if (failed.length) {
        for (const f of failed) console.log(`FAIL ${f.step} cd=${f.cd} ${f.detail}`);
        process.exitCode = 1;
    }
}

main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
