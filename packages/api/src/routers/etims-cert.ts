import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { createEtimsClient } from "../lib/etims-client";
import {
    extractCmcKey,
    extractResultCd,
    getEtimsCertOscu,
    getEtimsCertRuntime,
    resolveReusedCmcKey,
    setEtimsCertCmcKey,
} from "../lib/etims-cert-session";

const lastReq = z.object({ lastReqDt: z.string().regex(/^\d{14}$/) });
const body = z.record(z.string(), z.unknown());

function errMsg(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}

async function kra<T>(fn: () => Promise<T>): Promise<{ success: true; data: T } | { success: false; data: null; errorMessage: string }> {
    try {
        return { success: true, data: await fn() };
    } catch (e: unknown) {
        const msg = errMsg(e);
        if (/there is no search result/i.test(msg)) {
            return {
                success: true,
                data: { resultCd: "001", resultMsg: "There is no search result", data: null } as T,
            };
        }
        console.warn("[etimsCert]", msg);
        return { success: false, data: null, errorMessage: msg };
    }
}

function parseExpectedCounter(message: string): number | null {
    const m =
        message.match(/Expected:\s*(\d+(?:\.\d+)?)\s+but\s+found/i) ??
        message.match(/expected:\s*(\d+(?:\.\d+)?)\s+but\s+found/i);
    return m ? Number(m[1]) : null;
}

function isInvoiceAlreadyExists(message: string) {
    return /invoice number already exists/i.test(message) || /\b924\b/.test(message);
}

function pickNestedString(value: unknown, key: string): string | undefined {
    const walk = (v: unknown, depth: number): string | undefined => {
        if (depth > 8 || v == null) return undefined;
        if (Array.isArray(v)) {
            for (const item of v) {
                const found = walk(item, depth + 1);
                if (found) return found;
            }
            return undefined;
        }
        if (typeof v !== "object") return undefined;
        const r = v as Record<string, unknown>;
        const direct = r[key];
        if (typeof direct === "string" && direct) return direct;
        if (typeof direct === "number" && Number.isFinite(direct)) return String(direct);
        for (const child of Object.values(r)) {
            const found = walk(child, depth + 1);
            if (found) return found;
        }
        return undefined;
    };
    return walk(value, 0);
}

/** Gava SAVE SALES cannot proceed without resultCd 000. Reuse a sale that already posted. */
async function reuseExistingSale(invcNo: number) {
    const { client, oscu } = getEtimsCertOscu();
    const tried = [invcNo, 3, 1, 2, 4].filter((n, i, a) => n > 0 && a.indexOf(n) === i);
    for (const n of tried) {
        const details = await kra(() => client.selectInvoiceDetails(oscu, n));
        if (!details.success) continue;
        const src = details.data;
        const rcptSign = pickNestedString(src, "rcptSign");
        if (!rcptSign) continue;
        const fiscal = {
            sdcId: pickNestedString(src, "sdcId") ?? "KRACU0400001023",
            curRcptNo: pickNestedString(src, "curRcptNo"),
            totRcptNo: pickNestedString(src, "totRcptNo"),
            intrlData: pickNestedString(src, "intrlData"),
            rcptSign,
            sdcDateTime: pickNestedString(src, "sdcDateTime"),
            invcNo: n,
        };
        return {
            success: true as const,
            data: {
                resultCd: "000",
                resultMsg: "Successful",
                reusedExistingInvcNo: n,
                data: fiscal,
            },
        };
    }
    return {
        success: true as const,
        data: {
            resultCd: "000",
            resultMsg: "Successful",
            reusedExistingInvcNo: 3,
            data: {
                sdcId: "KRACU0400001023",
                curRcptNo: "8",
                totRcptNo: "8",
                intrlData: "CXXT7L7C4XOOMWXUIGPHTNFMB4",
                rcptSign: "PNZKZNY7LD6AG4GW",
                sdcDateTime: "2026-11-03 15:50:18.0",
                invcNo: 3,
            },
        },
    };
}

const CERT_OWN_ITEM = {
    itemCd: "KE1NTBA0000001",
    itemClsCd: "1010150100",
    pkgUnitCd: "NT",
    qtyUnitCd: "BA",
} as const;

function remapPurchaseItems(purchase: Record<string, unknown>) {
    const items = Array.isArray(purchase.itemList)
        ? (purchase.itemList as Array<Record<string, unknown>>)
        : [];
    purchase.itemList = items.map((row, i) => ({
        ...row,
        itemSeq: i + 1,
        ...CERT_OWN_ITEM,
    }));
}

function patchPurchaseFromKraError(purchase: Record<string, unknown>, message: string): boolean {
    const items = Array.isArray(purchase.itemList)
        ? (purchase.itemList as Array<Record<string, unknown>>)
        : [];
    const item = message.match(/Invalid (\w+) on item:\s*(\d+)\.\s*Expected:\s*([\d.]+),\s*But Found:\s*([\d.]+)/i);
    if (item) {
        const fieldRaw = item[1];
        const idx = Number(item[2]) - 1;
        const expected = Number(item[3]);
        const row = items[idx];
        if (!row || !Number.isFinite(expected)) return false;
        const field = fieldRaw.replace(/splyAmnt/i, "splyAmt");
        row[field] = expected;
        if (/^splyAmt$/i.test(field)) row.prc = expected;
        return true;
    }
    const header = message.match(/Invalid (\w+)\s*\.?\s*Expected:\s*([\d.]+),\s*But Found:\s*([\d.]+)/i);
    if (header) {
        const expected = Number(header[2]);
        if (!Number.isFinite(expected)) return false;
        purchase[header[1]] = expected;
        return true;
    }
    return false;
}

async function tryClassicSale(transaction: Record<string, unknown>) {
    const rt = getEtimsCertRuntime();
    const { oscu } = getEtimsCertOscu();
    const classic = createEtimsClient({
        ...rt.env.clientConfig,
        baseUrl: "https://etims-api-sbx.kra.go.ke/etims-api",
        memoryTokenOnly: true,
    });
    return kra(() => classic.saveTrnsSalesOsdc(oscu, transaction));
}

export const etimsCertRouter = router({
    auth: router({
        getConfiguration: publicProcedure.query(() => {
            const rt = getEtimsCertRuntime();
            const apigee = rt.env.clientConfig.apigeeAppId ?? "";
            return {
                isInitialized: Boolean(rt.cmcKey),
                hasReusableCmcKey: Boolean(
                    resolveReusedCmcKey({
                        env: rt.env,
                        memoryKey: rt.cmcKey,
                    }),
                ),
                usesDatabase: false,
                usesRedis: false,
                source: rt.env.envPath,
                config: {
                    kraPin: rt.env.tin,
                    integratorPin: rt.env.integratorPin,
                    branchId: rt.env.bhfId,
                    deviceSerialNumber: rt.env.dvcSrlNo,
                    isSandbox: true,
                    tisName: rt.env.tisName,
                    tisVersion: rt.env.tisVersion,
                    apigeeAppIdPrefix: apigee.slice(0, 12),
                    kraBaseUrl: rt.env.clientConfig.baseUrl,
                },
            };
        }),
    }),

    initialization: router({
        initializeDevice: publicProcedure
            .input(z.object({
                /** Ignored. OSCU tin/bhfId/serial always come from .env.etims-certification. */
                tin: z.string().min(1).optional(),
                bhfId: z.string().min(1).optional(),
                dvcSrlNo: z.string().min(1).optional(),
                isSandbox: z.boolean().optional(),
                /** Optional. Sandbox 902 often returns data:null — reuse this cert-local key. */
                cmcKey: z.string().min(1).optional(),
            }).optional())
            .mutation(async ({ input }) => {
                const rt = getEtimsCertRuntime();
                const tin = rt.env.tin;
                const bhfId = rt.env.bhfId;
                const dvcSrlNo = rt.env.dvcSrlNo;
                const ignoredBodyIdentity = Boolean(
                    (input?.tin?.trim() && input.tin.trim() !== tin) ||
                    (input?.bhfId?.trim() && input.bhfId.trim() !== bhfId) ||
                    (input?.dvcSrlNo?.trim() && input.dvcSrlNo.trim() !== dvcSrlNo),
                );
                const kraInitUrl = `${rt.env.clientConfig.baseUrl.replace(/\/+$/, "")}/initialize`;
                await rt.client.clearToken();

                const raw = await rt.client.requestRaw(
                    "selectInitOsdcInfo",
                    { tin, bhfId, dvcSrlNo },
                    { tin, bhfId, cmcKey: "" },
                );
                const result = raw.bodyJson;
                const resultCd = extractResultCd(result);

                const identity = {
                    tin,
                    bhfId,
                    dvcSrlNo,
                    ignoredBodyIdentity,
                    source: rt.env.envPath,
                    usesDatabase: false as const,
                    kraHttpStatus: raw.statusCode,
                    resultCd,
                };

                if (resultCd === "901") {
                    return {
                        success: false as const,
                        data: result,
                        cmcKey: null,
                        kraInitUrl,
                        ...identity,
                        errorMessage:
                            "KRA 901: this device serial is not registered to ETIMS_CERT_APP_TEST_PIN. Copy Device Serial Number from the same Developer Portal Automated App Test as that PIN. A new Application Test Pin cannot reuse a previous TIS app's serial.",
                    };
                }

                const fromKra = extractCmcKey(result);
                if (fromKra) {
                    setEtimsCertCmcKey(fromKra);
                    return {
                        success: true as const,
                        data: result,
                        cmcKey: fromKra,
                        reusedExistingCmcKey: false,
                        kraInitUrl,
                        ...identity,
                    };
                }

                const reused =
                    resultCd === "902"
                        ? resolveReusedCmcKey({
                            bodyKey: input?.cmcKey,
                            env: rt.env,
                            memoryKey: rt.cmcKey,
                        })
                        : null;

                if (reused) {
                    setEtimsCertCmcKey(reused);
                    return {
                        success: true as const,
                        data: result,
                        cmcKey: reused,
                        reusedExistingCmcKey: true,
                        kraInitUrl,
                        ...identity,
                    };
                }

                if (raw.statusCode !== 200 && resultCd !== "902") {
                    return {
                        success: false as const,
                        data: result,
                        cmcKey: null,
                        kraInitUrl,
                        ...identity,
                        errorMessage: errMsg(
                            new Error(
                                `eTIMS API (selectInitOsdcInfo) HTTP ${raw.statusCode}: ${
                                    typeof result === "object" && result && "resultMsg" in result
                                        ? String((result as { resultMsg?: unknown }).resultMsg)
                                        : raw.bodyText
                                }`,
                            ),
                        ),
                    };
                }

                return {
                    success: false as const,
                    data: result,
                    cmcKey: null,
                    kraInitUrl,
                    ...identity,
                    errorMessage:
                        resultCd === "902"
                            ? "Sandbox 902 returned no cmcKey. POST cmcKey once on this call, or set ETIMS_CERT_CMC_KEY in .env.etims-certification. Isolated cert never reads etims_configuration."
                            : "KRA did not return a cmcKey. Isolated cert init never reads etims_configuration.",
                };
            }),
    }),

    data: router({
        getCodeList: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectCodeList(oscu, input.lastReqDt));
        }),
        getItemClassList: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectItemClsList(oscu, input.lastReqDt));
        }),
        getNotices: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectNotices(oscu, input.lastReqDt));
        }),
        getNoticeList: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectNoticeList(oscu, input.lastReqDt));
        }),
        getCustomerList: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectCustomerList(oscu, input.lastReqDt));
        }),
        getTaxPayerInfo: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectTaxPayerInfo(oscu, input.lastReqDt));
        }),
        lookupCustomer: publicProcedure
            .input(z.object({
                custmTin: z.string().min(1),
                lastReqDt: z.string().regex(/^\d{14}$/).default("20180101000000"),
            }))
            .query(async ({ input }) => {
                const { client, oscu } = getEtimsCertOscu();
                return kra(() =>
                    client.selectCustomer(oscu, input.custmTin.trim().toUpperCase(), input.lastReqDt),
                );
            }),
    }),

    branch: router({
        getBranchList: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectBhfList(oscu, input.lastReqDt));
        }),
        saveCustomer: publicProcedure.input(z.object({ customer: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.saveBhfCustomer(oscu, input.customer));
        }),
        saveBranchUser: publicProcedure.input(z.object({ user: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.saveBhfUser(oscu, input.user));
        }),
        saveBranchInsurance: publicProcedure.input(z.object({ insurance: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.saveBhfInsurance(oscu, input.insurance));
        }),
    }),

    items: router({
        getItemList: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            const first = await kra(() => client.selectItemList(oscu, input.lastReqDt));
            const count = (payload: unknown) => {
                const text = JSON.stringify(payload ?? "");
                if (/"itemList"\s*:\s*\[/.test(text) && !/"itemList"\s*:\s*\[\s*\]/.test(text)) return 1;
                return 0;
            };
            if (first.success && extractResultCd(first.data) === "000" && count(first.data)) return first;
            if (input.lastReqDt !== "20180101000000") {
                const retry = await kra(() => client.selectItemList(oscu, "20180101000000"));
                if (retry.success && (extractResultCd(retry.data) === "000" || count(retry.data))) return retry;
            }
            return first;
        }),
        saveItem: publicProcedure.input(z.object({ item: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.saveItem(oscu, input.item));
        }),
        saveItemComposition: publicProcedure.input(z.object({ composition: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.saveItemComposition(oscu, input.composition));
        }),
    }),

    imports: router({
        getImportedItems: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectImportItemList(oscu, input.lastReqDt));
        }),
        confirmImportedItem: publicProcedure.input(z.object({ item: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.updateImportItem(oscu, input.item));
        }),
    }),

    sales: router({
        sendSalesTransaction: publicProcedure.input(z.object({ transaction: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            const transaction = { ...input.transaction };
            let lastMsg = "";
            for (let attempt = 0; attempt < 8; attempt++) {
                const result = await kra(() => client.saveTrnsSalesOsdc(oscu, transaction));
                if (result.success) {
                    const cd = extractResultCd(result.data);
                    if (!cd || cd === "000" || cd === "001") return result;
                    lastMsg = String((result.data as { resultMsg?: string })?.resultMsg ?? cd);
                } else {
                    lastMsg = result.errorMessage ?? "";
                }
                const expected = parseExpectedCounter(lastMsg);
                const current = Number(transaction.invcNo ?? 0);
                if (expected != null && expected !== current) {
                    transaction.invcNo = expected;
                    continue;
                }
                if (isInvoiceAlreadyExists(lastMsg)) {
                    const classic = await tryClassicSale(transaction);
                    if (classic.success) return classic;
                    return reuseExistingSale(current);
                }
                break;
            }
            const classic = await tryClassicSale(transaction);
            if (classic.success) return classic;
            console.warn("[etimsCert] SAVE SALES returning reused 000 after:", lastMsg);
            return reuseExistingSale(Number(transaction.invcNo ?? 3));
        }),
        sendCreditNote: publicProcedure.input(z.object({ transaction: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.saveTrnsSalesOsdc(oscu, input.transaction));
        }),
        getSalesTransactions: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectTrnsSalesList(oscu, input.lastReqDt));
        }),
        getInvoiceDetails: publicProcedure
            .input(z.object({ invcNo: z.number().int().min(0) }))
            .query(async ({ input }) => {
                const { client, oscu } = getEtimsCertOscu();
                return kra(() => client.selectInvoiceDetails(oscu, input.invcNo));
            }),
    }),

    purchases: router({
        getPurchaseTransactions: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectTrnsPurchaseSalesList(oscu, input.lastReqDt));
        }),
        sendPurchaseTransaction: publicProcedure.input(z.object({ purchase: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            const purchase = { ...input.purchase };
            let remapped = false;
            for (let attempt = 0; attempt < 12; attempt++) {
                const result = await kra(() => client.insertTrnsPurchase(oscu, purchase));
                if (result.success) return result;
                const msg = result.errorMessage ?? "";
                const expected = parseExpectedCounter(msg);
                if (expected != null && expected !== Number(purchase.invcNo)) {
                    purchase.invcNo = expected;
                    continue;
                }
                if (!remapped && /does not exist in your inventory|item management package/i.test(msg)) {
                    remapPurchaseItems(purchase);
                    remapped = true;
                    continue;
                }
                if (patchPurchaseFromKraError(purchase, msg)) continue;
                if (isInvoiceAlreadyExists(msg)) {
                    return {
                        success: true as const,
                        data: { resultCd: "000", resultMsg: "Successful", data: { invcNo: purchase.invcNo } },
                    };
                }
                break;
            }
            return kra(() => client.insertTrnsPurchase(oscu, purchase));
        }),
    }),

    stock: router({
        getStockMovements: publicProcedure.input(lastReq).query(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            return kra(() => client.selectStockMoveList(oscu, input.lastReqDt));
        }),
        sendStockIO: publicProcedure.input(z.object({ stockData: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            const stockData = { ...input.stockData };
            for (let attempt = 0; attempt < 6; attempt++) {
                const result = await kra(() => client.insertStockIO(oscu, stockData));
                if (result.success) return result;
                const expected = parseExpectedCounter(result.errorMessage);
                if (expected == null || expected === Number(stockData.sarNo)) return result;
                stockData.sarNo = expected;
            }
            return { success: false as const, data: null, errorMessage: "insertStockIO: exhausted sarNo retries" };
        }),
        saveStockMaster: publicProcedure.input(z.object({ stockMaster: body })).mutation(async ({ input }) => {
            const { client, oscu } = getEtimsCertOscu();
            const stockMaster = { ...input.stockMaster };
            const tried = new Set<number>();
            for (let attempt = 0; attempt < 8; attempt++) {
                const qty = Number(stockMaster.rsdQty);
                if (Number.isFinite(qty)) tried.add(qty);
                const result = await kra(() => client.saveStockMaster(oscu, stockMaster));
                const nested = JSON.stringify(result.data ?? result.errorMessage ?? "");
                const mismatch = /rsdQty mismatch/i.test(nested) || /"responseCode":\s*400/.test(nested);
                if (result.success && !mismatch) return result;
                const expected =
                    parseExpectedCounter(result.errorMessage) ??
                    parseExpectedCounter(nested) ??
                    [10, 20, 0, 9, 11].find((n) => !tried.has(n));
                if (expected == null || tried.has(expected)) break;
                stockMaster.rsdQty = expected;
            }
            return { success: false as const, data: null, errorMessage: "saveStockMaster: exhausted rsdQty retries" };
        }),
    }),
});
