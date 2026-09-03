/**
 * KRA eTIMS Developer Platform  Automated App Test runner
 *
 * Calls every certification test-case endpoint step-by-step via our EtimsOscuClient,
 * logs the EXACT unaltered KRA response, and writes results to JSON.
 *
 * Prerequisites:
 *   1. Start Automated App Test on the KRA Developer Portal first
 *   2. Device already initialized in nPanel (cmcKey in DB) OR step 1 will init
 *   3. Prefer apps/server/.env.etims-certification (portal session), else .env
 *
 * Run from apps/server:
 *   bun run etims:certification
 *   bun run src/scripts/write-etims-cert-env.ts   # refresh cert env from .env + portal stamps
 *
 * Optional:
 *   SKIP_INIT=1          skip re-initialization
 *   ONLY=selectCodeList  run a single step by endpointKey
 *
 * Cert-env identity overrides (ETIMS_CERT_*):
 *   TIN, BHF_ID, DEVICE_SERIAL, CMC_KEY, APP_TEST_PIN, SANDBOX
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import {
    buildClientConfigFromEnv,
    getEtimsClient,
} from "@npanel/api/lib/etims-config";
import type {
    EtimsEndpointKey,
    EtimsOscuHeaders,
    EtimsRawResponse,
} from "@npanel/api/lib/etims-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "../..");
const CERT_ENV = path.join(SERVER_ROOT, ".env.etims-certification");
const DEFAULT_ENV = path.join(SERVER_ROOT, ".env");
// Load default first, then cert env overrides so portal session wins.
config({ path: DEFAULT_ENV });
if (existsSync(CERT_ENV)) {
    config({ path: CERT_ENV, override: true });
}

const LAST_REQ_DT = "20180101000000";
const OUT_DIR = path.resolve(__dirname, "../../.etims-certification");
const stamp = () =>
    new Date().toISOString().replace(/[:.]/g, "-");

type Step = {
    testCase: string;
    kraLabel: string;
    endpointKey: EtimsEndpointKey;
    /** Build request body. May use prior step results. */
    body: (ctx: RunContext) => Record<string, unknown>;
    /** Init has no cmcKey yet */
    needsCmcKey?: boolean;
};

type KraItem = {
    itemCd: string;
    itemClsCd: string;
    itemTyCd: string;
    itemNm: string;
    orgnNatCd: string;
    pkgUnitCd: string;
    qtyUnitCd: string;
    taxTyCd: string;
    dftPrc: number;
    useYn: string;
};

type RunContext = {
    tin: string;
    bhfId: string;
    dvcSrlNo: string;
    cmcKey: string;
    isSandbox: boolean;
    /** KRA Developer Portal "Application Test Pin" for this session */
    appTestPin: string;
    tisName: string;
    tisVersion: string;
    /** Full product list from KRA selectItemList */
    kraItems: KraItem[];
    /** Classification codes from selectItemClsList (required for SAVE ITEM) */
    itemClsOptions: Array<{ itemClsCd: string; itemClsNm: string; taxTyCd: string }>;
    /** @deprecated kept for logs  prefer sessionGoods */
    serviceTemplate: KraItem | null;
    /** ItemCd created in this certification session (official KRA format, no X) */
    newItemCd: string;
    /** In-session item used for sales / purchase / stock */
    txnItem: KraItem | null;
    /** In-session goods for composition / stock (parent) */
    goodsItem: KraItem | null;
    /** In-session goods for composition (child) */
    goodsItem2: KraItem | null;
    invcNo: number;
    /** Session stock I/O counter  certification expects starting at 1 */
    sarNo: number;
    results: Record<string, EtimsRawResponse>;
};

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function nowParts() {
    // KRA rejects cfmDt slightly ahead of their server clock  bias a few minutes back.
    const d = new Date(Date.now() - 5 * 60 * 1000);
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const h = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    const s = pad2(d.getSeconds());
    return {
        salesDt: `${y}${m}${day}`,
        cfmDt: `${y}${m}${day}${h}${min}${s}`,
    };
}

function oscuFrom(ctx: RunContext): EtimsOscuHeaders {
    return { tin: ctx.tin, bhfId: ctx.bhfId, cmcKey: ctx.cmcKey };
}

function lastReq(ctx: RunContext) {
    return {
        tin: ctx.tin,
        bhfId: ctx.bhfId,
        cmcKey: ctx.cmcKey,
        lastReqDt: LAST_REQ_DT,
    };
}

function unwrapBody(bodyJson: unknown): Record<string, unknown> | null {
    if (!bodyJson || typeof bodyJson !== "object") return null;
    const root = bodyJson as Record<string, unknown>;
    const wrapped = root.responseBody;
    if (wrapped && typeof wrapped === "object") return wrapped as Record<string, unknown>;
    return root;
}

function resultCdOf(raw: EtimsRawResponse): string | null {
    const body = unwrapBody(raw.bodyJson);
    const cd = body?.resultCd;
    return typeof cd === "string" ? cd : null;
}

/** Certification pass: business success (000), empty (001), or device-already-installed (902). */
function isStepOk(raw: EtimsRawResponse): boolean {
    const cd = resultCdOf(raw);
    if (cd === "000" || cd === "001" || cd === "902") return true;
    if (raw.statusCode === 200 && cd == null) {
        const root = raw.bodyJson as { responseHeader?: { responseCode?: number } } | null;
        return root?.responseHeader?.responseCode === 200;
    }
    return false;
}

function parseKraItem(row: Record<string, unknown>): KraItem | null {
    if (!row.itemCd) return null;
    const tax = String(row.taxTyCd ?? "B");
    return {
        itemCd: String(row.itemCd),
        itemClsCd: String(row.itemClsCd ?? ""),
        itemTyCd: String(row.itemTyCd ?? "3"),
        itemNm: String(row.itemNm ?? ""),
        orgnNatCd: String(row.orgnNatCd ?? "KE"),
        pkgUnitCd: String(row.pkgUnitCd ?? "OU"),
        qtyUnitCd: String(row.qtyUnitCd ?? "U"),
        taxTyCd: ["A", "B", "C", "D", "E"].includes(tax) ? tax : "B",
        dftPrc: Number(row.dftPrc ?? 0) || 0,
        useYn: row.useYn === "N" ? "N" : "Y",
    };
}

function parseItemList(bodyJson: unknown): KraItem[] {
    const body = unwrapBody(bodyJson);
    const data = body?.data as Record<string, unknown> | undefined;
    const list = data?.itemList;
    if (!Array.isArray(list)) return [];
    return list
        .map((row) => parseKraItem(row as Record<string, unknown>))
        .filter((x): x is KraItem => x != null);
}

/**
 * Official KRA itemCd (OSCU §4.19 / Developer Guide §7.18):
 *   [Country(2)][Type(1)][PkgUnit][QtyUnit][Seq(7)]
 * Example: KE2NTBA0000012
 *
 * Do NOT insert an "X" between pkg and qty  Apigee parses that as qtyUnitCd "XU"
 * and returns "Incorrect QtyUnitCd Prefix".
 */
function generateNextItemCd(
    list: KraItem[],
    opts: { orgnNatCd: string; itemTyCd: string; pkgUnitCd: string; qtyUnitCd: string },
): string {
    const prefix = `${opts.orgnNatCd}${opts.itemTyCd}${opts.pkgUnitCd}${opts.qtyUnitCd}`;
    let maxSeq = 0;
    for (const it of list) {
        if (!it.itemCd.startsWith(prefix)) continue;
        const seq = Number.parseInt(it.itemCd.slice(prefix.length), 10);
        if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
    }
    return `${prefix}${String(maxSeq + 1).padStart(7, "0")}`;
}

function buildSaveItemBody(
    ctx: RunContext,
    item: {
        itemCd: string;
        itemClsCd: string;
        itemTyCd: string;
        itemNm: string;
        orgnNatCd: string;
        pkgUnitCd: string;
        qtyUnitCd: string;
        taxTyCd: string;
        dftPrc: number;
    },
): Record<string, unknown> {
    const price = item.dftPrc > 0 ? item.dftPrc : 1000;
    return {
        tin: ctx.tin,
        bhfId: ctx.bhfId,
        cmcKey: ctx.cmcKey,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemTyCd: item.itemTyCd,
        itemNm: item.itemNm,
        itemStdNm: item.itemNm,
        orgnNatCd: item.orgnNatCd,
        pkgUnitCd: item.pkgUnitCd,
        qtyUnitCd: item.qtyUnitCd,
        taxTyCd: item.taxTyCd,
        btchNo: null,
        bcd: null,
        dftPrc: price,
        grpPrcL1: price,
        grpPrcL2: price,
        grpPrcL3: price,
        grpPrcL4: price,
        grpPrcL5: 0,
        addInfo: null,
        sftyQty: 0,
        isrcAplcbYn: "N",
        useYn: "Y",
        regrId: "Admin",
        regrNm: "Admin",
        modrId: "Admin",
        modrNm: "Admin",
    };
}

/** New in-session goods using classification from selectItemClsList. */
function planSessionGoods(
    ctx: RunContext,
    name: string,
    reservedCds: string[] = [],
): KraItem {
    const cls = pickSaveItemCls(ctx.itemClsOptions);
    const orgnNatCd = "KE";
    const itemTyCd = "1";
    // Apigee requires 2-char qty units in itemCd (U fails with "Incorrect QtyUnitCd Prefix").
    // Official format: Country+Type+Pkg+Qty+Seq7 with NO "X" separator (OSCU §4.19: KE2NTBA0000012).
    const pkgUnitCd = "NT";
    const qtyUnitCd = "BA";
    const synthetic = [
        ...ctx.kraItems,
        ...reservedCds.map((itemCd) => ({
            itemCd,
            itemClsCd: "",
            itemTyCd,
            itemNm: "",
            orgnNatCd,
            pkgUnitCd,
            qtyUnitCd,
            taxTyCd: "B",
            dftPrc: 0,
            useYn: "Y",
        })),
    ];
    const itemCd = generateNextItemCd(synthetic, {
        orgnNatCd,
        itemTyCd,
        pkgUnitCd,
        qtyUnitCd,
    });
    return {
        itemCd,
        itemClsCd: cls?.itemClsCd ?? "1010150100",
        itemTyCd,
        itemNm: name,
        orgnNatCd,
        pkgUnitCd,
        qtyUnitCd,
        taxTyCd: cls?.taxTyCd ?? "B",
        dftPrc: 1000,
        useYn: "Y",
    };
}

/** If KRA rejects sequence, parse expected ending digit and rebuild itemCd. */
function itemCdWithExpectedSeq(itemCd: string, expectedEnding: string): string | null {
    const m = expectedEnding.match(/(\d+)$/);
    if (!m) return null;
    const seq = m[1].padStart(7, "0");
    if (itemCd.length < 7) return null;
    return `${itemCd.slice(0, -7)}${seq}`;
}

function parseExpectedSeqFromError(raw: EtimsRawResponse): string | null {
    const hdr = (raw.bodyJson as { responseHeader?: { debugMessage?: string; customerMessage?: string } } | null)
        ?.responseHeader;
    const text = `${hdr?.debugMessage ?? ""} ${hdr?.customerMessage ?? ""}`;
    const m = text.match(/ending with[:\s]*\*+(\d+)/i) ?? text.match(/(\d{7})\s*$/);
    return m?.[1] ?? null;
}

function kraHeaderText(raw: EtimsRawResponse): string {
    const hdr = (raw.bodyJson as { responseHeader?: { debugMessage?: string; customerMessage?: string } } | null)
        ?.responseHeader;
    return `${hdr?.debugMessage ?? ""} ${hdr?.customerMessage ?? ""}`;
}

/** Parse "Expected: N but found: M" style session counter hints. */
function parseExpectedCounter(raw: EtimsRawResponse): number | null {
    const text = kraHeaderText(raw);
    const m =
        text.match(/Expected:\s*(\d+)\s+but\s+found/i) ??
        text.match(/Expected\s+(\d+)\s+but\s+found/i);
    return m ? Number(m[1]) : null;
}

function isNoPurchaseQueueError(raw: EtimsRawResponse): boolean {
    const text = kraHeaderText(raw).toLowerCase();
    return (
        text.includes("dont have any purchase records") ||
        text.includes("don't have any purchase records") ||
        (text.includes("no search result") && text.includes("purchase"))
    );
}

/** Session requires invcNo=1 but taxpayer already used it historically. */
function isInvcNoHistoryCollision(raw: EtimsRawResponse): boolean {
    const cd = resultCdOf(raw);
    const text = kraHeaderText(raw).toLowerCase();
    return cd === "924" || text.includes("invoice number already exists");
}

/** Highest invcNo in a sales-list response (0 if empty). */
function maxInvcNoFromSalesList(bodyJson: unknown): number {
    const body = unwrapBody(bodyJson);
    const data = body?.data as Record<string, unknown> | undefined;
    const list = data?.salesList;
    if (!Array.isArray(list)) return 0;
    let max = 0;
    for (const row of list) {
        const n = Number((row as Record<string, unknown>)?.invcNo);
        if (Number.isFinite(n)) max = Math.max(max, n);
    }
    return max;
}

/** Build one stock I/O line (amounts must satisfy splyAmt = prc * qty). */
function stockIoLine(item: KraItem, itemSeq: number, qty: number) {
    const unitTaxbl = item.dftPrc > 0 ? item.dftPrc : 1000;
    const unit = taxBuckets(item.taxTyCd, unitTaxbl);
    const taxbl = Number((unit.taxbl * qty).toFixed(2));
    const tax = Number((unit.tax * qty).toFixed(2));
    const tot = Number((unit.tot * qty).toFixed(2));
    return {
        line: {
            itemSeq,
            itemCd: item.itemCd,
            itemClsCd: item.itemClsCd,
            itemNm: item.itemNm,
            bcd: null,
            pkgUnitCd: item.pkgUnitCd,
            pkg: 1,
            qtyUnitCd: item.qtyUnitCd,
            qty,
            itemExprDt: null,
            prc: unit.tot,
            splyAmt: tot,
            totDcAmt: 0,
            taxblAmt: taxbl,
            taxTyCd: item.taxTyCd,
            taxAmt: tax,
            totAmt: tot,
        },
        taxbl,
        tax,
        tot,
    };
}

function parseItemClsList(bodyJson: unknown): Array<{
    itemClsCd: string;
    itemClsNm: string;
    taxTyCd: string;
}> {
    const body = unwrapBody(bodyJson);
    const data = body?.data as Record<string, unknown> | undefined;
    const list = data?.itemClsList;
    if (!Array.isArray(list)) return [];
    return list
        .map((row) => {
            const r = row as Record<string, unknown>;
            if (!r.itemClsCd) return null;
            const tax = String(r.taxTyCd ?? "B");
            return {
                itemClsCd: String(r.itemClsCd),
                itemClsNm: String(r.itemClsNm ?? ""),
                taxTyCd: ["A", "B", "C", "D", "E"].includes(tax) ? tax : "B",
            };
        })
        .filter((x): x is { itemClsCd: string; itemClsNm: string; taxTyCd: string } => x != null);
}

function pickSaveItemCls(
    options: Array<{ itemClsCd: string; itemClsNm: string; taxTyCd: string }>,
): { itemClsCd: string; taxTyCd: string } | null {
    if (!options.length) return null;
    // Prefer a leaf-ish tax-B code (same preference as UI “level 4” for services)
    const taxB = options.filter((o) => o.taxTyCd === "B");
    const pick =
        taxB.sort((a, b) => b.itemClsCd.length - a.itemClsCd.length)[0] ??
        options.sort((a, b) => b.itemClsCd.length - a.itemClsCd.length)[0];
    return pick ? { itemClsCd: pick.itemClsCd, taxTyCd: pick.taxTyCd } : null;
}

function hydrateFromProductList(ctx: RunContext, bodyJson: unknown) {
    const items = parseItemList(bodyJson);
    ctx.kraItems = items;

    // Certification session inventory is isolated: existing selectItemList rows are NOT
    // in-session Item Management. Plan brand-new goods with official itemCd (no X).
    const parent = planSessionGoods(ctx, "Cert Goods Parent");
    const child = planSessionGoods(ctx, "Cert Goods Child", [parent.itemCd]);

    ctx.goodsItem = parent;
    ctx.goodsItem2 = child;
    ctx.txnItem = parent;
    ctx.newItemCd = parent.itemCd;
    ctx.serviceTemplate = parent;
}

function taxRate(taxTyCd: string): number {
    if (taxTyCd === "B") return 16;
    if (taxTyCd === "E") return 8;
    return 0;
}

/** Build header tax buckets from a single line item (UI / KRA pattern). */
function taxBuckets(taxTyCd: string, taxbl: number) {
    const rate = taxRate(taxTyCd);
    const tax = Number(((taxbl * rate) / 100).toFixed(2));
    const tot = taxbl + tax;
    const empty = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const taxblBy = { ...empty, [taxTyCd]: taxbl } as Record<string, number>;
    const taxBy = { ...empty, [taxTyCd]: tax } as Record<string, number>;
    const rtBy = { A: 0, B: 16, C: 0, D: 0, E: 0 };
    // Only advertise the rate for bands that are active on this invoice.
    if (taxTyCd === "B") rtBy.B = 16;
    if (taxTyCd === "E") rtBy.E = 8;
    return {
        taxbl,
        tax,
        tot,
        taxblAmtA: taxblBy.A,
        taxblAmtB: taxblBy.B,
        taxblAmtC: taxblBy.C,
        taxblAmtD: taxblBy.D,
        taxblAmtE: taxblBy.E,
        taxRtA: rtBy.A,
        taxRtB: rtBy.B,
        taxRtC: rtBy.C,
        taxRtD: rtBy.D,
        taxRtE: rtBy.E,
        taxAmtA: taxBy.A,
        taxAmtB: taxBy.B,
        taxAmtC: taxBy.C,
        taxAmtD: taxBy.D,
        taxAmtE: taxBy.E,
    };
}

function requireTxnItem(ctx: RunContext): KraItem {
    if (!ctx.txnItem) {
        throw new Error(
            "No active KRA products found  register at least one item in Agency → KRA eTIMS → Products first.",
        );
    }
    return ctx.txnItem;
}

const STEPS: Step[] = [
    {
        testCase: "OSCU INITIALIZATION",
        kraLabel: "/selectInitOsdcInfo",
        endpointKey: "selectInitOsdcInfo",
        needsCmcKey: false,
        body: (ctx) => ({
            tin: ctx.tin,
            bhfId: ctx.bhfId,
            dvcSrlNo: ctx.dvcSrlNo,
        }),
    },
    {
        testCase: "LOOK UP LIST OF CODE",
        kraLabel: "/selectCodeList",
        endpointKey: "selectCodeList",
        body: lastReq,
    },
    {
        testCase: "LOOK UP ITEM CLASSIFICATION",
        kraLabel: "/selectItemClsList",
        endpointKey: "selectItemClsList",
        body: lastReq,
    },
    {
        testCase: "LOOK UP BRANCH LIST",
        kraLabel: "/selectBhfList",
        endpointKey: "selectBhfList",
        body: lastReq,
    },
    {
        testCase: "LOOK UP NOTICES LIST",
        kraLabel: "/selectNotices",
        endpointKey: "selectNotices",
        body: lastReq,
    },
    {
        testCase: "SAVE CUSTOMER BRANCH",
        kraLabel: "/saveBhfCustomer",
        endpointKey: "saveBhfCustomer",
        body: (ctx) => ({
            tin: ctx.tin,
            bhfId: ctx.bhfId,
            cmcKey: ctx.cmcKey,
            custNo: "CUST001",
            custTin:
                ctx.tin === ctx.appTestPin
                    ? "P052377334H"
                    : ctx.appTestPin || ctx.tin,
            custNm: "Automated Test Customer",
            adrs: "Nairobi",
            telNo: "0700000000",
            email: "cert@nisccloud.com",
            faxNo: null,
            useYn: "Y",
            remark: "automated certification",
            regrId: "Admin",
            regrNm: "Admin",
            modrId: "Admin",
            modrNm: "Admin",
        }),
    },
    {
        testCase: "SAVE BRANCH USER ACCOUNT",
        kraLabel: "/saveBhfUser",
        endpointKey: "saveBhfUser",
        body: (ctx) => ({
            tin: ctx.tin,
            bhfId: ctx.bhfId,
            cmcKey: ctx.cmcKey,
            userId: "certuser01",
            userNm: "Cert User",
            pwd: "CertPass123!",
            adrs: "Nairobi",
            cntc: "0700000001",
            authCd: "1",
            remark: "automated certification",
            useYn: "Y",
            regrId: "Admin",
            regrNm: "Admin",
            modrId: "Admin",
            modrNm: "Admin",
        }),
    },
    {
        testCase: "SAVE BRANCH INSURANCES",
        kraLabel: "/saveBhfInsurance",
        endpointKey: "saveBhfInsurance",
        body: (ctx) => ({
            tin: ctx.tin,
            bhfId: ctx.bhfId,
            cmcKey: ctx.cmcKey,
            isrccCd: "ISRCC01",
            isrccNm: "Test Insurance Co",
            isrcRt: 10,
            useYn: "Y",
            regrId: "Admin",
            regrNm: "Admin",
            modrId: "Admin",
            modrNm: "Admin",
        }),
    },
    {
        testCase: "LOOK UP PRODUCT LIST",
        kraLabel: "/selectItemList",
        endpointKey: "selectItemList",
        body: lastReq,
    },
    {
        testCase: "SAVE ITEM",
        kraLabel: "/saveItem",
        endpointKey: "saveItem",
        // Create a NEW in-session goods item with official itemCd (no X separator).
        // Classification must come from selectItemClsList.
        body: (ctx) => {
            const item = ctx.goodsItem ?? planSessionGoods(ctx, "Cert Goods Parent");
            ctx.goodsItem = item;
            ctx.txnItem = item;
            ctx.newItemCd = item.itemCd;
            return buildSaveItemBody(ctx, item);
        },
    },
    {
        testCase: "LOOK UP IMPORTED ITEM LIST",
        kraLabel: "/selectImportItemList",
        endpointKey: "selectImportItemList",
        body: lastReq,
    },
    {
        testCase: "UPDATE IMPORTED ITEMS",
        kraLabel: "/updateImportItem",
        endpointKey: "updateImportItem",
        body: (ctx) => {
            const item = ctx.goodsItem ?? requireTxnItem(ctx);
            return {
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                cmcKey: ctx.cmcKey,
                taskCd: "TASK001",
                dclDe: "20200101",
                itemSeq: 1,
                hsCd: "8471300000",
                itemClsCd: item.itemClsCd,
                itemCd: item.itemCd,
                imptItemSttsCd: "3",
                modrId: "Admin",
                modrNm: "Admin",
                remark: "automated certification",
            };
        },
    },
    {
        // Stock I/O must precede stock-master (KRA: "Stock IO is empty…").
        // Composition also requires the child in stock master  seed both items here.
        testCase: "SAVE STOCK IN/OUT",
        kraLabel: "/insertStockIO",
        endpointKey: "insertStockIO",
        body: (ctx) => {
            const parent = ctx.goodsItem ?? requireTxnItem(ctx);
            const child = ctx.goodsItem2;
            const { salesDt } = nowParts();
            const qty = 10;
            const lines = [stockIoLine(parent, 1, qty)];
            if (child && child.itemCd !== parent.itemCd) {
                lines.push(stockIoLine(child, 2, qty));
            }
            const taxbl = Number(lines.reduce((s, x) => s + x.taxbl, 0).toFixed(2));
            const tax = Number(lines.reduce((s, x) => s + x.tax, 0).toFixed(2));
            const tot = Number(lines.reduce((s, x) => s + x.tot, 0).toFixed(2));
            return {
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                cmcKey: ctx.cmcKey,
                sarNo: ctx.sarNo,
                orgSarNo: 0,
                regTyCd: "M",
                custTin: null,
                custNm: null,
                custBhfId: null,
                sarTyCd: "06",
                ocrnDt: salesDt,
                totItemCnt: lines.length,
                totTaxblAmt: taxbl,
                totTaxAmt: tax,
                totAmt: tot,
                remark: "automated certification stock adjustment",
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
                itemList: lines.map((x) => x.line),
            };
        },
    },
    {
        testCase: "LOOK UP STOCK MOVEMENT",
        kraLabel: "/selectStockMoveList",
        endpointKey: "selectStockMoveList",
        body: lastReq,
    },
    {
        testCase: "SAVE STOCK-MASTER INFORMATION",
        kraLabel: "/saveStockMaster",
        endpointKey: "saveStockMaster",
        body: (ctx) => {
            const item = ctx.goodsItem ?? requireTxnItem(ctx);
            return {
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                cmcKey: ctx.cmcKey,
                itemCd: item.itemCd,
                rsdQty: 10,
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
            };
        },
    },
    {
        // Composition needs both items in Item Management AND stock for the parent.
        testCase: "SAVE ITEM COMPOSITION",
        kraLabel: "/saveItemComposition",
        endpointKey: "saveItemComposition",
        body: (ctx) => {
            const parent = ctx.goodsItem ?? requireTxnItem(ctx);
            const child = ctx.goodsItem2 ?? parent;
            return {
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                cmcKey: ctx.cmcKey,
                itemCd: parent.itemCd,
                cpstItemCd: child.itemCd,
                cpstQty: 1,
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
            };
        },
    },
    {
        testCase: "SAVE SALES TRANSACTION",
        kraLabel: "/saveTrnsSalesOsdc",
        endpointKey: "saveTrnsSalesOsdc",
        body: (ctx) => {
            const item = requireTxnItem(ctx);
            const { salesDt, cfmDt } = nowParts();
            const taxbl = item.dftPrc > 0 ? item.dftPrc : 1000;
            const t = taxBuckets(item.taxTyCd, taxbl);
            // Session invcNo must start at 1; trdInvcNo can be a unique trade reference
            // so we do not collide with historical production invoices (e.g. invcNo=1 credit note).
            const trdInvcNo = `CERT${String(Date.now()).slice(-10)}`;
            const custTin =
                ctx.tin === ctx.appTestPin
                    ? "P052377334H"
                    : ctx.appTestPin || null;
            const custNm = custTin
                ? "Automated Test Customer"
                : "Walk-in Customer";
            return {
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                cmcKey: ctx.cmcKey,
                trdInvcNo,
                invcNo: ctx.invcNo,
                orgInvcNo: 0,
                custTin,
                custNm,
                salesTyCd: "N",
                rcptTyCd: "S",
                pmtTyCd: "01",
                salesSttsCd: "02",
                cfmDt,
                salesDt,
                stockRlsDt: cfmDt,
                cnclReqDt: null,
                cnclDt: null,
                rfdDt: null,
                rfdRsnCd: null,
                totItemCnt: 1,
                taxblAmtA: t.taxblAmtA,
                taxblAmtB: t.taxblAmtB,
                taxblAmtC: t.taxblAmtC,
                taxblAmtD: t.taxblAmtD,
                taxblAmtE: t.taxblAmtE,
                taxRtA: t.taxRtA,
                taxRtB: t.taxRtB,
                taxRtC: t.taxRtC,
                taxRtD: t.taxRtD,
                taxRtE: t.taxRtE,
                taxAmtA: t.taxAmtA,
                taxAmtB: t.taxAmtB,
                taxAmtC: t.taxAmtC,
                taxAmtD: t.taxAmtD,
                taxAmtE: t.taxAmtE,
                totTaxblAmt: t.taxbl,
                totTaxAmt: t.tax,
                totAmt: t.tot,
                prchrAcptcYn: "N",
                remark: "automated certification sale",
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
                receipt: {
                    custTin,
                    custMblNo: ctx.appTestPin ? "0700000000" : null,
                    rcptPbctDt: cfmDt,
                    trdeNm: null,
                    adrs: null,
                    topMsg: null,
                    btmMsg: null,
                    prchrAcptcYn: "N",
                },
                itemList: [
                    {
                        itemSeq: 1,
                        itemCd: item.itemCd,
                        itemClsCd: item.itemClsCd,
                        itemNm: item.itemNm,
                        bcd: null,
                        pkgUnitCd: item.pkgUnitCd,
                        pkg: 1,
                        qtyUnitCd: item.qtyUnitCd,
                        qty: 1,
                        // Apigee validates splyAmt === prc * qty (not tax-exclusive supply).
                        prc: t.tot,
                        splyAmt: t.tot,
                        dcRt: 0,
                        dcAmt: 0,
                        isrccCd: null,
                        isrccNm: null,
                        isrcRt: null,
                        isrcAmt: null,
                        taxTyCd: item.taxTyCd,
                        taxblAmt: t.taxbl,
                        taxAmt: t.tax,
                        totAmt: t.tot,
                    },
                ],
            };
        },
    },
    {
        testCase: "LOOK UP PURCHASES-SALES LIST",
        kraLabel: "/selectTrnsPurchaseSalesList",
        endpointKey: "selectTrnsPurchaseSalesList",
        body: lastReq,
    },
    {
        testCase: "SAVE PURCHASES INFORMATION",
        kraLabel: "/insertTrnsPurchase",
        endpointKey: "insertTrnsPurchase",
        body: (ctx) => {
            const item = ctx.goodsItem ?? requireTxnItem(ctx);
            const { salesDt, cfmDt } = nowParts();
            const taxbl = item.dftPrc > 0 ? item.dftPrc : 1000;
            const t = taxBuckets(item.taxTyCd, taxbl);
            const pchsInvcNo = ctx.invcNo + 1;
            return {
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                cmcKey: ctx.cmcKey,
                spplrTin: "P052100681P",
                invcNo: pchsInvcNo,
                orgInvcNo: 0,
                spplrBhfId: "00",
                spplrNm: "NAMIRI TECHNOLOGY LIMITED",
                spplrInvcNo: pchsInvcNo,
                regTyCd: "M",
                pchsTyCd: "N",
                rcptTyCd: "P",
                pmtTyCd: "01",
                pchsSttsCd: "02",
                cfmDt,
                pchsDt: salesDt,
                wrhsDt: null,
                cnclReqDt: null,
                cnclDt: null,
                rfdDt: null,
                totItemCnt: 1,
                taxblAmtA: t.taxblAmtA,
                taxblAmtB: t.taxblAmtB,
                taxblAmtC: t.taxblAmtC,
                taxblAmtD: t.taxblAmtD,
                taxblAmtE: t.taxblAmtE,
                taxRtA: t.taxRtA,
                taxRtB: t.taxRtB,
                taxRtC: t.taxRtC,
                taxRtD: t.taxRtD,
                taxRtE: t.taxRtE,
                taxAmtA: t.taxAmtA,
                taxAmtB: t.taxAmtB,
                taxAmtC: t.taxAmtC,
                taxAmtD: t.taxAmtD,
                taxAmtE: t.taxAmtE,
                totTaxblAmt: t.taxbl,
                totTaxAmt: t.tax,
                totAmt: t.tot,
                remark: "automated certification purchase",
                regrId: "Admin",
                regrNm: "Admin",
                modrId: "Admin",
                modrNm: "Admin",
                itemList: [
                    {
                        itemSeq: 1,
                        itemCd: item.itemCd,
                        itemClsCd: item.itemClsCd,
                        itemNm: item.itemNm,
                        bcd: null,
                        spplrItemClsCd: null,
                        spplrItemCd: null,
                        spplrItemNm: null,
                        pkgUnitCd: item.pkgUnitCd,
                        pkg: 1,
                        qtyUnitCd: item.qtyUnitCd,
                        qty: 1,
                        prc: t.tot,
                        splyAmt: t.tot,
                        dcRt: 0,
                        dcAmt: 0,
                        taxblAmt: t.taxbl,
                        taxTyCd: item.taxTyCd,
                        taxAmt: t.tax,
                        totAmt: t.tot,
                        itemExprDt: null,
                    },
                ],
            };
        },
    },
    {
        testCase: "LOOK UP INVOICE DETAILS",
        kraLabel: "/selectInvoiceDetails",
        endpointKey: "selectInvoiceDetails",
        body: (ctx) => ({
            tin: ctx.tin,
            bhfId: ctx.bhfId,
            cmcKey: ctx.cmcKey,
            invcNo: ctx.invcNo,
        }),
    },
    {
        testCase: "LOOK UP TRANSACTION SALES LIST",
        kraLabel: "/selectTrnsSalesList",
        endpointKey: "selectTrnsSalesList",
        body: lastReq,
    },
    {
        testCase: "LOOK UP CUSTOMER LIST",
        kraLabel: "/selectCustomerList",
        endpointKey: "selectCustomerList",
        body: lastReq,
    },
    {
        testCase: "LOOK UP TAX PAYER INFO",
        kraLabel: "/selectTaxPayerInfo",
        endpointKey: "selectTaxPayerInfo",
        // Classic OSCU maps this to /selectCustomer (own PIN). Dev Platform uses lastReqDt.
        body: (ctx) => ({
            tin: ctx.tin,
            bhfId: ctx.bhfId,
            cmcKey: ctx.cmcKey,
            lastReqDt: "20180101000000",
            custmTin: ctx.tin,
        }),
    },
];

function extractCmcKey(bodyJson: unknown): string | null {
    if (!bodyJson || typeof bodyJson !== "object") return null;
    const root = bodyJson as Record<string, unknown>;
    const wrapped = root.responseBody;
    const payload =
        wrapped && typeof wrapped === "object"
            ? (wrapped as Record<string, unknown>)
            : root;
    const data = payload.data as Record<string, unknown> | undefined;
    const info = data?.info as Record<string, unknown> | undefined;
    const key = info?.cmcKey ?? payload.cmcKey ?? data?.cmcKey;
    return typeof key === "string" && key.length > 0 ? key : null;
}

type DeviceConfig = {
    kraPin: string;
    branchId: string;
    deviceSerialNumber: string;
    cmcKey: string | null;
    isSandbox: boolean;
    source: string;
};

/**
 * Prefer .env.etims-certification identity; fall back to DB for missing fields (esp. cmcKey).
 */
async function loadDeviceConfig(): Promise<DeviceConfig> {
    const [row] = await db.select().from(eTimsConfiguration).limit(1);

    const tin = process.env.ETIMS_CERT_TIN?.trim() || row?.kraPin;
    const branchId = process.env.ETIMS_CERT_BHF_ID?.trim() || row?.branchId;
    const serial =
        process.env.ETIMS_CERT_DEVICE_SERIAL?.trim() ||
        row?.deviceSerialNumber;
    const cmcKey =
        process.env.ETIMS_CERT_CMC_KEY?.trim() || row?.cmcKey || null;
    const isSandbox =
        process.env.ETIMS_CERT_SANDBOX !== undefined
            ? process.env.ETIMS_CERT_SANDBOX !== "false"
            : (row?.isSandbox ?? true);

    if (!tin || !branchId || !serial) {
        throw new Error(
            "Missing TIN / branch / serial. Set ETIMS_CERT_* in .env.etims-certification or initialize the device in Settings.",
        );
    }

    const fromCert = Boolean(
        process.env.ETIMS_CERT_TIN ||
            process.env.ETIMS_CERT_BHF_ID ||
            process.env.ETIMS_CERT_DEVICE_SERIAL,
    );
    return {
        kraPin: tin,
        branchId,
        deviceSerialNumber: serial,
        cmcKey,
        isSandbox,
        source: fromCert
            ? existsSync(CERT_ENV)
                ? ".env.etims-certification (+ DB cmcKey if unset)"
                : "ETIMS_CERT_* env (+ DB)"
            : "DB etims_configuration",
    };
}

async function main() {
    const only = process.env.ONLY?.trim();
    const skipInit = process.env.SKIP_INIT === "1";

    console.log("═══ KRA eTIMS Certification Test Runner ═══\n");
    console.log("Ensure the Developer Portal Automated App Test session is ACTIVE.\n");

    const cfg = await loadDeviceConfig();
    const ctx: RunContext = {
        tin: cfg.kraPin,
        bhfId: cfg.branchId,
        dvcSrlNo: cfg.deviceSerialNumber,
        cmcKey: cfg.cmcKey ?? "",
        isSandbox: cfg.isSandbox,
        appTestPin: process.env.ETIMS_CERT_APP_TEST_PIN?.trim() || "",
        tisName: process.env.ETIMS_CERT_TIS_NAME?.trim() || "nPanel",
        tisVersion: process.env.ETIMS_CERT_TIS_VERSION?.trim() || "1.0.0",
        kraItems: [],
        itemClsOptions: [],
        serviceTemplate: null,
        newItemCd: "",
        txnItem: null,
        goodsItem: null,
        goodsItem2: null,
        invcNo: 1, // certification session sales counter starts at 1
        sarNo: 1,
        results: {},
    };

    if (!ctx.cmcKey && skipInit) {
        throw new Error("No cmcKey in DB/cert-env and SKIP_INIT=1  cannot continue.");
    }

    console.log(`config source: ${cfg.source}`);
    console.log(`TIN=${ctx.tin}  bhfId=${ctx.bhfId}  serial=${ctx.dvcSrlNo}`);
    console.log(
        `sandbox=${ctx.isSandbox}  invcNo=${ctx.invcNo}  appTestPin=${ctx.appTestPin || "(none)"}`,
    );
    console.log(`TIS=${ctx.tisName} v${ctx.tisVersion}`);
    console.log(
        `Apigee=${(process.env.ETIMS_APIGEE_APP_ID ?? "").slice(0, 12)}…\n`,
    );
    console.log(
        "Mocks are built from KRA selectItemList / selectItemClsList (UI Products flow).\n",
    );

    const client = getEtimsClient(buildClientConfigFromEnv(ctx.isSandbox));
    await mkdir(OUT_DIR, { recursive: true });

    const summary: Array<{
        testCase: string;
        kraLabel: string;
        endpointKey: string;
        kraPath: string;
        statusCode: number;
        resultCd: string | null;
        ok: boolean;
    }> = [];

    for (const [index, step] of STEPS.entries()) {
        if (only && step.endpointKey !== only) continue;
        if (skipInit && step.endpointKey === "selectInitOsdcInfo") {
            console.log(`⏭  [${index + 1}/${STEPS.length}] ${step.testCase} (SKIP_INIT)\n`);
            continue;
        }

        const needsKey = step.needsCmcKey !== false;
        if (needsKey && !ctx.cmcKey) {
            console.error(`✗  [${index + 1}] ${step.testCase}: missing cmcKey  run init first`);
            summary.push({
                testCase: step.testCase,
                kraLabel: step.kraLabel,
                endpointKey: step.endpointKey,
                kraPath: "",
                statusCode: 0,
                resultCd: null,
                ok: false,
            });
            continue;
        }

        const oscu =
            step.endpointKey === "selectInitOsdcInfo"
                ? { tin: ctx.tin, bhfId: ctx.bhfId, cmcKey: "" }
                : oscuFrom(ctx);

        let body = step.body(ctx);

        console.log(`── [${index + 1}/${STEPS.length}] ${step.testCase}`);
        console.log(`   KRA label: ${step.kraLabel}  →  client key: ${step.endpointKey}`);
        console.log(`   Request body: ${JSON.stringify(body).slice(0, 200)}…`);

        let raw: EtimsRawResponse;
        try {
            raw = await client.requestRaw(step.endpointKey, body, oscu);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`   EXCEPTION: ${message}\n`);
            summary.push({
                testCase: step.testCase,
                kraLabel: step.kraLabel,
                endpointKey: step.endpointKey,
                kraPath: "",
                statusCode: 0,
                resultCd: null,
                ok: false,
            });
            continue;
        }

        // saveItem: certification uses a session sequence counter invisible via selectItemList.
        // Retry with the expected suffix when KRA returns "Invalid itemCd Sequence".
        if (step.endpointKey === "saveItem") {
            for (let attempt = 0; attempt < 5 && !isStepOk(raw); attempt++) {
                const expected = parseExpectedSeqFromError(raw);
                const currentCd = String(body.itemCd ?? "");
                if (!expected || !currentCd) break;
                const nextCd = itemCdWithExpectedSeq(currentCd, expected);
                if (!nextCd || nextCd === currentCd) break;
                console.log(`   Sequence rejected → retrying as ${nextCd}`);
                if (ctx.goodsItem) ctx.goodsItem = { ...ctx.goodsItem, itemCd: nextCd };
                if (ctx.txnItem) ctx.txnItem = { ...ctx.txnItem, itemCd: nextCd };
                ctx.newItemCd = nextCd;
                // Keep child seq ahead of parent
                if (ctx.goodsItem2) {
                    const childCd = itemCdWithExpectedSeq(
                        ctx.goodsItem2.itemCd,
                        String(Number(expected) + 1),
                    );
                    if (childCd) ctx.goodsItem2 = { ...ctx.goodsItem2, itemCd: childCd };
                }
                body = buildSaveItemBody(ctx, ctx.goodsItem!);
                raw = await client.requestRaw("saveItem", body, oscuFrom(ctx));
                await Bun.sleep(300);
            }
        }

        // insertStockIO: session sarNo must match KRA's expected counter.
        if (step.endpointKey === "insertStockIO") {
            for (let attempt = 0; attempt < 5 && !isStepOk(raw); attempt++) {
                const expected = parseExpectedCounter(raw);
                if (expected == null || expected === ctx.sarNo) break;
                console.log(`   sarNo rejected → retrying as ${expected}`);
                ctx.sarNo = expected;
                body = { ...body, sarNo: expected };
                raw = await client.requestRaw("insertStockIO", body, oscuFrom(ctx));
                await Bun.sleep(300);
            }
            if (isStepOk(raw)) ctx.sarNo += 1;
        }

        // saveTrnsSalesOsdc: session invcNo starts at 1; retry on counter / date / 924 collision.
        if (step.endpointKey === "saveTrnsSalesOsdc") {
            for (let attempt = 0; attempt < 8 && !isStepOk(raw); attempt++) {
                const cd = resultCdOf(raw);
                const text = kraHeaderText(raw);
                const expected = parseExpectedCounter(raw);
                if (expected != null && expected !== ctx.invcNo) {
                    console.log(`   invcNo rejected → retrying as ${expected}`);
                    ctx.invcNo = expected;
                    body = { ...body, invcNo: expected };
                } else if (/future date/i.test(text)) {
                    const { salesDt, cfmDt } = nowParts();
                    console.log(`   Future cfmDt → retrying with ${cfmDt}`);
                    body = {
                        ...body,
                        salesDt,
                        cfmDt,
                        stockRlsDt: cfmDt,
                        receipt: {
                            ...(body.receipt as Record<string, unknown>),
                            rcptPbctDt: cfmDt,
                        },
                    };
                } else if (cd === "924" || isInvcNoHistoryCollision(raw)) {
                    // Historical invcNo collision  advance past max used on this device.
                    let next = ctx.invcNo + 1;
                    try {
                        const hist = await client.requestRaw(
                            "selectTrnsSalesList",
                            {
                                tin: ctx.tin,
                                bhfId: ctx.bhfId,
                                cmcKey: ctx.cmcKey,
                                lastReqDt: "20180101000000",
                            },
                            oscuFrom(ctx),
                        );
                        const max = maxInvcNoFromSalesList(hist.bodyJson);
                        if (max >= ctx.invcNo) next = max + 1;
                    } catch {
                        /* keep next = invcNo + 1 */
                    }
                    console.log(
                        `   invcNo ${ctx.invcNo} already exists → retrying as ${next}`,
                    );
                    ctx.invcNo = next;
                    body = { ...body, invcNo: next };
                } else {
                    break;
                }
                raw = await client.requestRaw("saveTrnsSalesOsdc", body, oscuFrom(ctx));
                await Bun.sleep(300);
            }
        }

        ctx.results[step.endpointKey] = raw;

        // Capture cmcKey from init without mutating the logged response
        if (step.endpointKey === "selectInitOsdcInfo") {
            const key = extractCmcKey(raw.bodyJson);
            if (key) {
                ctx.cmcKey = key;
                console.log(`   cmcKey captured (${key.slice(0, 8)}…)`);
            } else if (!ctx.cmcKey) {
                console.warn("   WARN: init did not return cmcKey  later steps may fail");
            }
        }

        if (step.endpointKey === "selectItemClsList") {
            ctx.itemClsOptions = parseItemClsList(raw.bodyJson);
            const pick = pickSaveItemCls(ctx.itemClsOptions);
            console.log(
                `   Classification codes: ${ctx.itemClsOptions.length}` +
                    (pick
                        ? `  → SAVE ITEM will use ${pick.itemClsCd} (tax ${pick.taxTyCd})`
                        : ""),
            );
        }

        if (step.endpointKey === "selectItemList") {
            hydrateFromProductList(ctx, raw.bodyJson);
            console.log(`   KRA products: ${ctx.kraItems.length}`);
            console.log(
                `   SAVE ITEM will create: ${ctx.goodsItem?.itemCd} (${ctx.goodsItem?.itemNm})` +
                    ` cls=${ctx.goodsItem?.itemClsCd} units=${ctx.goodsItem?.pkgUnitCd}/${ctx.goodsItem?.qtyUnitCd}`,
            );
            console.log(
                `   Composition child: ${ctx.goodsItem2?.itemCd}` +
                    `  Sales/stock: ${ctx.txnItem?.itemCd}`,
            );
        }

        const ok =
            isStepOk(raw) ||
            (step.endpointKey === "insertTrnsPurchase" && isNoPurchaseQueueError(raw));

        if (
            step.endpointKey === "insertTrnsPurchase" &&
            !isStepOk(raw) &&
            isNoPurchaseQueueError(raw)
        ) {
            console.log(
                "   No purchase queue from KRA (selectTrnsPurchaseSalesList empty)  treating as OK for certification.",
            );
        }

        if (
            step.endpointKey === "saveTrnsSalesOsdc" &&
            !isStepOk(raw) &&
            isInvcNoHistoryCollision(raw)
        ) {
            console.log(
                "   Could not allocate a free invcNo after retries  check sales history on this device.",
            );
        }

        // After SAVE ITEM succeeds, also register the composition child in-session.
        if (step.endpointKey === "saveItem" && ok && ctx.goodsItem2) {
            console.log(`   Saved in-session item: ${ctx.goodsItem?.itemCd}`);
            let child = ctx.goodsItem2;
            let childBody = buildSaveItemBody(ctx, child);
            console.log(`   Also saving composition child: ${child.itemCd}…`);
            try {
                let childRaw = await client.requestRaw(
                    "saveItem",
                    childBody,
                    oscuFrom(ctx),
                );
                for (let attempt = 0; attempt < 5 && !isStepOk(childRaw); attempt++) {
                    const expected = parseExpectedSeqFromError(childRaw);
                    if (!expected) break;
                    const nextCd = itemCdWithExpectedSeq(child.itemCd, expected);
                    if (!nextCd || nextCd === child.itemCd) break;
                    console.log(`   Child sequence rejected → retrying as ${nextCd}`);
                    child = { ...child, itemCd: nextCd };
                    ctx.goodsItem2 = child;
                    childBody = buildSaveItemBody(ctx, child);
                    childRaw = await client.requestRaw(
                        "saveItem",
                        childBody,
                        oscuFrom(ctx),
                    );
                    await Bun.sleep(300);
                }
                const childOk = isStepOk(childRaw);
                console.log(
                    `   Child HTTP ${childRaw.statusCode} resultCd=${resultCdOf(childRaw) ?? ""}` +
                        (childOk ? " ✓" : " ✗"),
                );
                if (!childOk) {
                    console.log(`   Child response: ${childRaw.bodyText.slice(0, 300)}`);
                }
            } catch (err) {
                console.warn(
                    `   Child saveItem failed: ${err instanceof Error ? err.message : String(err)}`,
                );
            }
            await Bun.sleep(400);
        }

        // Composition requires child in stock master as well.
        if (step.endpointKey === "saveStockMaster" && ok && ctx.goodsItem2) {
            const child = ctx.goodsItem2;
            if (child.itemCd !== ctx.goodsItem?.itemCd) {
                console.log(`   Also stocking composition child: ${child.itemCd}…`);
                try {
                    const childMaster = {
                        tin: ctx.tin,
                        bhfId: ctx.bhfId,
                        cmcKey: ctx.cmcKey,
                        itemCd: child.itemCd,
                        rsdQty: 10,
                        regrId: "Admin",
                        regrNm: "Admin",
                        modrId: "Admin",
                        modrNm: "Admin",
                    };
                    const childRaw = await client.requestRaw(
                        "saveStockMaster",
                        childMaster,
                        oscuFrom(ctx),
                    );
                    const childOk = isStepOk(childRaw);
                    console.log(
                        `   Child stock master HTTP ${childRaw.statusCode} resultCd=${resultCdOf(childRaw) ?? ""}` +
                            (childOk ? " ✓" : " ✗"),
                    );
                    if (!childOk) {
                        console.log(`   Child stock master: ${childRaw.bodyText.slice(0, 300)}`);
                    }
                } catch (err) {
                    console.warn(
                        `   Child stock master failed: ${err instanceof Error ? err.message : String(err)}`,
                    );
                }
                await Bun.sleep(300);
            }
        }

        const resultCd = resultCdOf(raw);
        console.log(
            `   HTTP ${raw.statusCode}  resultCd=${resultCd ?? ""}  path=${raw.kraPath}`,
        );
        console.log("   ── RAW KRA RESPONSE (unaltered) ──");
        console.log(raw.bodyText);
        console.log("   ──────────────────────────────────\n");

        summary.push({
            testCase: step.testCase,
            kraLabel: step.kraLabel,
            endpointKey: step.endpointKey,
            kraPath: raw.kraPath,
            statusCode: raw.statusCode,
            resultCd,
            ok,
        });

        // Brief pause so KRA session logging keeps order
        await Bun.sleep(400);
    }

    const outFile = path.join(OUT_DIR, `results-${stamp()}.json`);
    await writeFile(
        outFile,
        JSON.stringify(
            {
                ranAt: new Date().toISOString(),
                tin: ctx.tin,
                bhfId: ctx.bhfId,
                newItemCd: ctx.newItemCd,
                txnItemCd: ctx.txnItem?.itemCd ?? null,
                goodsItemCd: ctx.goodsItem?.itemCd ?? null,
                invcNo: ctx.invcNo,
                summary,
                responses: ctx.results,
            },
            null,
            2,
        ),
        "utf8",
    );

    console.log("═══ SUMMARY ═══");
    for (const row of summary) {
        console.log(
            `${row.ok ? "✓" : "✗"}  HTTP ${row.statusCode || ""}  resultCd=${row.resultCd ?? ""}  ${row.testCase}  (${row.kraLabel})`,
        );
    }
    console.log(`\nFull raw responses written to:\n  ${outFile}`);
    console.log("\nRemember: upload artefacts on the Developer Portal within 1 hour.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
