import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { EtimsApiError } from "../lib/etims-client";
import {
    certIdentityMatchesEnv,
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
        message.match(/Expected:\s*(\d+)\s+but\s+found/i) ??
        message.match(/expected:\s*(\d+)\s+but\s+found/i);
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
                        identityMatchesEnv: true,
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
                tin: z.string().min(1).optional(),
                bhfId: z.string().min(1).optional(),
                dvcSrlNo: z.string().min(1).optional(),
                isSandbox: z.boolean().optional(),
                /** Optional. Sandbox 902 often returns data:null — reuse this cert-local key. */
                cmcKey: z.string().min(1).optional(),
            }).optional())
            .mutation(async ({ input }) => {
                const rt = getEtimsCertRuntime();
                const tin = input?.tin?.trim() || rt.env.tin;
                const bhfId = input?.bhfId?.trim() || rt.env.bhfId;
                const dvcSrlNo = input?.dvcSrlNo?.trim() || rt.env.dvcSrlNo;
                const kraInitUrl = `${rt.env.clientConfig.baseUrl.replace(/\/+$/, "")}/initialize`;
                await rt.client.clearToken();

                let result: unknown;
                try {
                    result = await rt.client.selectInitOsdcInfo({ tin, bhfId, dvcSrlNo });
                } catch (e: unknown) {
                    if (e instanceof EtimsApiError && e.resultCd === "902") {
                        result = e.response;
                    } else {
                        return { success: false as const, data: null, cmcKey: null, kraInitUrl, errorMessage: errMsg(e) };
                    }
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
                        source: rt.env.envPath,
                        usesDatabase: false,
                    };
                }

                const resultCd = extractResultCd(result);
                const reused =
                    resultCd === "902"
                        ? resolveReusedCmcKey({
                            bodyKey: input?.cmcKey,
                            env: rt.env,
                            memoryKey: rt.cmcKey,
                            identityMatchesEnv: certIdentityMatchesEnv(rt.env, input),
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
                        source: rt.env.envPath,
                        usesDatabase: false,
                    };
                }

                return {
                    success: false as const,
                    data: result,
                    cmcKey: null,
                    kraInitUrl,
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
            .input(z.object({ custmTin: z.string().min(1) }))
            .query(async ({ input }) => {
                const { client, oscu } = getEtimsCertOscu();
                return kra(() => client.selectCustomer(oscu, input.custmTin.trim().toUpperCase()));
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
            return kra(() => client.saveStockMaster(oscu, input.stockMaster));
        }),
    }),
});
