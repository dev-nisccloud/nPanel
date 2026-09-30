import { z } from "zod";
import { publicProcedure, router } from "../trpc";
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
            return kra(() => client.selectItemList(oscu, input.lastReqDt));
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
            return kra(() => client.saveTrnsSalesOsdc(oscu, input.transaction));
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
            return kra(() => client.insertTrnsPurchase(oscu, input.purchase));
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
            for (let attempt = 0; attempt < 6; attempt++) {
                const result = await kra(() => client.saveStockMaster(oscu, stockMaster));
                if (result.success) return result;
                const expected = parseExpectedCounter(result.errorMessage);
                if (expected == null || expected === Number(stockMaster.rsdQty)) return result;
                stockMaster.rsdQty = expected;
            }
            return { success: false as const, data: null, errorMessage: "saveStockMaster: exhausted rsdQty retries" };
        }),
    }),
});
