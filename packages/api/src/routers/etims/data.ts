import { z } from "zod";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getEtimsContext, buildClientConfigFromEnv } from "../../lib/etims-config";
import { createEtimsClient } from "../../lib/etims-client";
import {
    getEtimsItemClassListFromDb,
    getEtimsItemClassMeta,
    getEtimsItemClassificationByCode,
    listEtimsItemClassifications,
} from "../../lib/etims-item-classification-store";
import {
    getEtimsCodeListFromDb,
    getEtimsCodeMeta,
    listEtimsCodes,
    syncEtimsCodeList,
} from "../../lib/etims-code-store";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const unusedOscu = { tin: "", bhfId: "", cmcKey: "" };

const isAgencyUser = (role: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

function assertReadAccess(role: string | null | undefined) {
    if (skipEtimsAuthChecks()) return;
    if (!isAgencyUser(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only agency users can access eTIMS data." });
    }
}

/** Normalized customer shape returned to the UI. */
export type EtimsCustomerLookup = {
    custmTin: string;
    custmNm: string;
    adrs?: string | null;
    telNo?: string | null;
    email?: string | null;
    taxprSttsCd?: string | null;
    source: "kra_registry" | "branch_list";
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function pickStr(raw: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
        const value = raw[key];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
}

const CLASSIC_SANDBOX_BASE = "https://etims-api-sbx.kra.go.ke/etims-api";
const CLASSIC_PROD_BASE = "https://etims-api.kra.go.ke/etims-api";

const CUSTOMER_NAME_KEYS = [
    "custmNm",
    "custNm",
    "taxprNm",
    "taxpayerNm",
    "taxprName",
    "customerNm",
] as const;

const CUSTOMER_TIN_KEYS = ["custmTin", "custTin", "tin", "taxprTin"] as const;

function tinOf(raw: Record<string, unknown>): string {
    return pickStr(raw, ...CUSTOMER_TIN_KEYS).toUpperCase();
}

function collectNamedRecords(value: unknown, out: Record<string, unknown>[], depth = 0) {
    if (depth > 6 || value == null) return;
    if (Array.isArray(value)) {
        for (const item of value) collectNamedRecords(item, out, depth + 1);
        return;
    }
    const rec = asRecord(value);
    if (!rec) return;
    if (pickStr(rec, ...CUSTOMER_NAME_KEYS) || tinOf(rec)) out.push(rec);
    for (const nested of [rec.data, rec.responseBody, rec.info, rec.customer, rec.custList, rec.infoList, rec.itemList]) {
        collectNamedRecords(nested, out, depth + 1);
    }
}

function extractRegistryPayload(
    result: unknown,
    searchedTin: string,
    ownTin: string,
): Record<string, unknown> | null {
    const wanted = searchedTin.trim().toUpperCase();
    const self = ownTin.trim().toUpperCase();
    const candidates: Record<string, unknown>[] = [];
    collectNamedRecords(result, candidates);

    const matching = candidates.find((c) => tinOf(c) === wanted && pickStr(c, ...CUSTOMER_NAME_KEYS));
    if (matching) return matching;

    // Gava `/customerPinInfo` often echoes *our* taxpayer. Never treat that as the lookup target.
    if (wanted !== self) {
        return null;
    }
    return candidates.find((c) => tinOf(c) === self && pickStr(c, ...CUSTOMER_NAME_KEYS)) ?? null;
}

function normalizeRegistryCustomer(raw: Record<string, unknown>, fallbackTin: string): EtimsCustomerLookup | null {
    const name = pickStr(raw, ...CUSTOMER_NAME_KEYS);
    const tin = tinOf(raw) || fallbackTin;
    if (!name) return null;
    if (tin && tin !== fallbackTin.trim().toUpperCase()) return null;

    const addressParts = [raw.locDesc, raw.sctrNm, raw.dstrtNm, raw.prvncNm, raw.adrs]
        .filter((v) => typeof v === "string" && v.trim().length > 0);
    return {
        custmTin: (tin || fallbackTin).toUpperCase(),
        custmNm: name,
        adrs: addressParts.length ? addressParts.join(", ") : pickStr(raw, "adrs") || null,
        telNo: pickStr(raw, "telNo", "mgrTelNo") || null,
        email: pickStr(raw, "email", "mgrEmail") || null,
        taxprSttsCd: pickStr(raw, "taxprSttsCd") || null,
        source: raw.custNo ? "branch_list" : "kra_registry",
    };
}

function extractBranchCustomerList(result: unknown): Record<string, unknown>[] {
    const root = asRecord(result);
    if (!root) return [];
    const data = asRecord(root.data) ?? asRecord(root.responseBody) ?? root;
    const list = data.custList ?? data.customerList ?? data.infoList;
    return Array.isArray(list) ? list as Record<string, unknown>[] : [];
}

function collectTaxpayerRecords(value: unknown, out: Record<string, unknown>[], depth = 0) {
    if (depth > 8 || value == null) return;
    if (Array.isArray(value)) {
        for (const item of value) collectTaxpayerRecords(item, out, depth + 1);
        return;
    }
    const rec = asRecord(value);
    if (!rec) return;
    if (
        pickStr(rec, ...CUSTOMER_NAME_KEYS, "bhfNm", "locDesc", "prvncNm", "dstrtNm", "sctrNm", "taxprSttsCd", "bsnsActv")
        || tinOf(rec)
    ) {
        out.push(rec);
    }
    for (const nested of [
        rec.data, rec.responseBody, rec.info, rec.customer, rec.custList,
        rec.infoList, rec.itemList, rec.bhfList, rec.branchList, rec.taxpayerList, rec.taxPayerList,
    ]) {
        collectTaxpayerRecords(nested, out, depth + 1);
    }
}

type EtimsTaxpayerInfo = {
    tin: string;
    taxprNm: string;
    taxprSttsCd: string;
    locDesc: string;
    sctrNm: string;
    dstrtNm: string;
    prvncNm: string;
    bhfId: string;
    bhfNm: string;
    bsnsActv: string;
    mgrNm: string;
    mgrTelNo: string;
    mgrEmail: string;
};

function emptyTaxpayer(ownTin = "", bhfId = ""): EtimsTaxpayerInfo {
    return {
        tin: ownTin,
        taxprNm: "",
        taxprSttsCd: "",
        locDesc: "",
        sctrNm: "",
        dstrtNm: "",
        prvncNm: "",
        bhfId,
        bhfNm: "",
        bsnsActv: "",
        mgrNm: "",
        mgrTelNo: "",
        mgrEmail: "",
    };
}

function taxpayerFromRecord(raw: Record<string, unknown>, ownTin = "", bhfId = ""): EtimsTaxpayerInfo {
    return {
        tin: tinOf(raw) || pickStr(raw, "tin") || ownTin,
        taxprNm: pickStr(raw, ...CUSTOMER_NAME_KEYS) || pickStr(raw, "bhfNm"),
        taxprSttsCd: pickStr(raw, "taxprSttsCd", "bhfSttsCd"),
        locDesc: pickStr(raw, "locDesc", "adrs"),
        sctrNm: pickStr(raw, "sctrNm"),
        dstrtNm: pickStr(raw, "dstrtNm"),
        prvncNm: pickStr(raw, "prvncNm"),
        bhfId: pickStr(raw, "bhfId") || bhfId,
        bhfNm: pickStr(raw, "bhfNm"),
        bsnsActv: pickStr(raw, "bsnsActv"),
        mgrNm: pickStr(raw, "mgrNm"),
        mgrTelNo: pickStr(raw, "mgrTelNo", "telNo"),
        mgrEmail: pickStr(raw, "mgrEmail", "email"),
    };
}

function flattenTaxpayer(result: unknown, ownTin: string, bhfId: string): EtimsTaxpayerInfo | null {
    const candidates: Record<string, unknown>[] = [];
    collectTaxpayerRecords(result, candidates);
    const wanted = ownTin.trim().toUpperCase();
    const ranked = candidates
        .map((rec) => ({
            rec,
            score:
                (pickStr(rec, ...CUSTOMER_NAME_KEYS) ? 8 : 0) +
                (pickStr(rec, "bhfNm") ? 2 : 0) +
                (pickStr(rec, "locDesc", "prvncNm", "dstrtNm") ? 1 : 0) +
                (tinOf(rec) === wanted ? 2 : 0),
        }))
        .filter((row) => {
            const tin = tinOf(row.rec);
            return !tin || tin === wanted;
        })
        .sort((a, b) => b.score - a.score);
    if (!ranked[0] || ranked[0].score <= 0) return null;
    return taxpayerFromRecord(ranked[0].rec, ownTin, bhfId);
}

function mergeTaxpayer(base: EtimsTaxpayerInfo | null, extra: EtimsTaxpayerInfo | null): EtimsTaxpayerInfo | null {
    if (!base) return extra;
    if (!extra) return base;
    return {
        tin: base.tin || extra.tin,
        taxprNm: base.taxprNm || extra.taxprNm,
        taxprSttsCd: base.taxprSttsCd || extra.taxprSttsCd,
        locDesc: base.locDesc || extra.locDesc,
        sctrNm: base.sctrNm || extra.sctrNm,
        dstrtNm: base.dstrtNm || extra.dstrtNm,
        prvncNm: base.prvncNm || extra.prvncNm,
        bhfId: base.bhfId || extra.bhfId,
        bhfNm: base.bhfNm || extra.bhfNm,
        bsnsActv: base.bsnsActv || extra.bsnsActv,
        mgrNm: base.mgrNm || extra.mgrNm,
        mgrTelNo: base.mgrTelNo || extra.mgrTelNo,
        mgrEmail: base.mgrEmail || extra.mgrEmail,
    };
}

function extractBhfRows(result: unknown): Record<string, unknown>[] {
    const root = asRecord(result);
    if (!root) return [];
    const data = asRecord(root.data) ?? asRecord(root.responseBody) ?? root;
    const inner = asRecord(data.data) ?? data;
    const list = inner.bhfList ?? inner.branchList ?? inner.itemList ?? inner.bhfInfoList;
    return Array.isArray(list) ? list as Record<string, unknown>[] : [];
}

/** Normalized branch customer for list/detail UI. */
export type EtimsBranchCustomer = {
    custNo: string;
    custTin: string;
    custNm: string;
    adrs?: string | null;
    telNo?: string | null;
    email?: string | null;
    faxNo?: string | null;
    useYn?: string | null;
    remark?: string | null;
};

function normalizeBranchCustomer(raw: Record<string, unknown>): EtimsBranchCustomer | null {
    const custNo = raw.custNo ?? raw.custmNo;
    const custTin = raw.custTin ?? raw.custmTin ?? raw.tin;
    const custNm = raw.custNm ?? raw.custmNm ?? raw.taxprNm;
    if (!custNo || !custTin || !custNm) return null;
    return {
        custNo: String(custNo),
        custTin: String(custTin).toUpperCase(),
        custNm: String(custNm),
        adrs: (raw.adrs as string | null | undefined) ?? null,
        telNo: (raw.telNo as string | null | undefined) ?? null,
        email: (raw.email as string | null | undefined) ?? null,
        faxNo: (raw.faxNo as string | null | undefined) ?? null,
        useYn: (raw.useYn as string | null | undefined) ?? null,
        remark: (raw.remark as string | null | undefined) ?? null,
    };
}

export const etimsDataRouter = router({
    /**
     * Standard code lists from `etims_code` (never live KRA).
     * `lastReqDt` is ignored; kept so existing callers keep compiling.
     */
    getCodeList: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").optional(),
        }).optional())
        .query(async ({ ctx }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const fromDb = await getEtimsCodeListFromDb();
                if (!fromDb) {
                    return {
                        success: true,
                        data: { clsList: [], codeList: [] },
                        source: "db" as const,
                        empty: true,
                        needsSync: true,
                        errorMessage: "No standard codes in the database. Use Sync now, or run `bun run etims:sync-codes` in apps/server.",
                    };
                }
                return { success: true, data: fromDb, source: "db" as const, empty: false, needsSync: false };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return {
                    success: false,
                    data: { clsList: [], codeList: [] },
                    source: "db" as const,
                    empty: true,
                    needsSync: true,
                    errorMessage: msg || "Failed to read standard codes",
                };
            }
        }),

    /** Code-list metadata and rows from `etims_code` (never live KRA). */
    listCodes: etimsProcedure
        .input(z.object({
            cdCls: z.string().optional(),
            search: z.string().optional(),
            includeUnused: z.boolean().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const result = await listEtimsCodes({
                    cdCls: input?.cdCls,
                    search: input?.search,
                    includeUnused: input?.includeUnused,
                });
                return {
                    success: true,
                    ...result,
                    errorMessage: result.needsSync
                        ? "No standard codes in the database. Use Sync now to pull them from KRA."
                        : undefined,
                };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return {
                    success: false,
                    items: [],
                    classes: [],
                    total: 0,
                    needsSync: true,
                    empty: true,
                    meta: null,
                    errorMessage: msg || "Failed to list standard codes",
                };
            }
        }),

    getCodeMeta: etimsProcedure
        .query(async ({ ctx }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const meta = await getEtimsCodeMeta();
                return {
                    success: true,
                    meta,
                    empty: !meta,
                    needsSync: !meta,
                    errorMessage: meta ? undefined : "No standard codes in the database. Use Sync now to pull them from KRA.",
                };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return {
                    success: false,
                    meta: null,
                    empty: true,
                    needsSync: true,
                    errorMessage: msg || "Failed to read standard codes",
                };
            }
        }),

    /** Pull `/selectCodeList` from KRA into `etims_code`. */
    syncCodeList: etimsProcedure
        .input(z.object({
            reset: z.boolean().optional(),
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").optional(),
        }).optional())
        .mutation(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { oscu, isSandbox } = await getEtimsContext();
            const client = createEtimsClient({
                ...buildClientConfigFromEnv(isSandbox),
                baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
                memoryTokenOnly: true,
            });
            try {
                const result = await syncEtimsCodeList(client, oscu, {
                    reset: input?.reset ?? true,
                    lastReqDt: input?.lastReqDt,
                });
                return { success: true, ...result };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to sync standard codes" });
            }
        }),

    /**
     * Retrieve item classification codes for categorizing products.
     * POST /selectItemClsList
     * @deprecated Prefer getItemClassMeta + listItemClassifications.
     */
    getItemClassList: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
        }))
        .query(async ({ ctx }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const fromDb = await getEtimsItemClassListFromDb();
                if (!fromDb) {
                    return {
                        success: false,
                        data: null,
                        source: "db" as const,
                        errorMessage: "No item classifications in the database. Run `bun run etims:sync-classifications` in apps/server.",
                    };
                }
                return { success: true, data: fromDb, source: "db" as const };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return { success: false, data: null, source: "db" as const, errorMessage: msg || "Failed to read item classifications" };
            }
        }),

    /** Classification metadata from `etims_item_classification` (never live KRA). */
    getItemClassMeta: etimsProcedure
        .query(async ({ ctx }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const meta = await getEtimsItemClassMeta(unusedOscu);
                return {
                    success: true,
                    meta,
                    empty: !meta,
                    needsSync: !meta,
                    allowAutoSync: false,
                    errorMessage: meta ? undefined : "No item classifications in the database. Run `bun run etims:sync-classifications` in apps/server.",
                };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return {
                    success: false,
                    meta: null,
                    empty: true,
                    needsSync: true,
                    allowAutoSync: false,
                    errorMessage: msg || "Failed to read item classifications",
                };
            }
        }),

    /** Paginated, searchable item classifications from the local database. */
    listItemClassifications: etimsProcedure
        .input(z.object({
            level: z.number().int().min(1).max(5),
            search: z.string().optional(),
            page: z.number().int().min(1).default(1),
            pageSize: z.number().int().min(1).max(100).default(25),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const result = await listEtimsItemClassifications(unusedOscu, input);
                return { success: true, ...result, items: result.items ?? [] };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return {
                    success: false,
                    items: [],
                    total: 0,
                    page: input.page,
                    pageSize: input.pageSize,
                    totalPages: 0,
                    needsSync: true,
                    empty: true,
                    errorMessage: msg || "Failed to list item classifications",
                };
            }
        }),

    /** Look up one classification code from the local database. */
    getItemClassification: etimsProcedure
        .input(z.object({ itemClsCd: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            try {
                const item = await getEtimsItemClassificationByCode(unusedOscu, input.itemClsCd.trim());
                return { success: true, item: item ?? null };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                return { success: false, item: null, errorMessage: msg || "Failed to look up classification" };
            }
        }),

    /**
     * Look up a customer by KRA TIN.
     * Gava `/customerPinInfo` often returns *our* taxpayer (Namiri Technology). Prefer a
     * record whose TIN matches the searched PIN, then classic `/selectCustomer`, then the branch list.
     */
    lookupCustomer: etimsProcedure
        .input(z.object({
            custmTin: z.string().min(1, "Customer TIN is required"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu, isSandbox } = await getEtimsContext();
            const custmTin = input.custmTin.trim().toUpperCase();

            const fromResult = (result: unknown) => {
                const payload = extractRegistryPayload(result, custmTin, oscu.tin);
                return payload ? normalizeRegistryCustomer(payload, custmTin) : null;
            };

            try {
                try {
                    const fromGava = fromResult(await client.selectCustomer(oscu, custmTin));
                    if (fromGava) return { success: true, data: fromGava };
                } catch {
                    // Gava `/customerPinInfo` is the device taxpayer, not a PIN search.
                }

                try {
                    const classic = createEtimsClient({
                        ...buildClientConfigFromEnv(isSandbox),
                        baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
                        memoryTokenOnly: true,
                    });
                    const fromClassic = fromResult(await classic.selectCustomer(oscu, custmTin));
                    if (fromClassic) return { success: true, data: fromClassic };
                } catch {
                    // Classic `/selectCustomer` is unavailable on some sessions.
                }

                const listResult = await client.selectCustomerList(oscu, "20230101000000");
                const branchMatch = extractBranchCustomerList(listResult).find(
                    (c) => tinOf(c) === custmTin,
                );
                if (branchMatch) {
                    const normalized = normalizeRegistryCustomer(branchMatch, custmTin);
                    if (normalized) return { success: true, data: normalized };
                }

                return { success: true, data: null };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to look up customer" });
            }
        }),

    /**
     * List customers registered on the active eTIMS branch.
     * POST /selectCustomerList
     */
    getCustomerList: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").default("20230101000000"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();

            try {
                const result = await client.selectCustomerList(oscu, input.lastReqDt);
                const customers = extractBranchCustomerList(result)
                    .map(normalizeBranchCustomer)
                    .filter((c): c is EtimsBranchCustomer => c != null);
                return { success: true, data: customers };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve customer list" });
            }
        }),

    /**
     * Retrieve KRA notices (announcements, policy changes).
     * POST /selectNoticeList
     */
    getNoticeList: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();

            try {
                const result = await client.selectNoticeList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve notice list" });
            }
        }),

    /** Dashboard test case: POST /selectNotices */
    getNotices: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectNotices(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve notices" });
            }
        }),

    /**
     * Taxpayer / branch identity for settings and receipts.
     * Gava `/selectTaxpayerInfo` often returns 000 with an empty body; fall back to
     * `/customerPinInfo` for our own PIN, then the matching row from `/branchList`.
     */
    getTaxPayerInfo: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").default("20180101000000"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                let taxpayer = flattenTaxpayer(
                    await client.selectTaxPayerInfo(oscu, input.lastReqDt),
                    oscu.tin,
                    oscu.bhfId,
                );

                if (!taxpayer?.taxprNm) {
                    try {
                        taxpayer = mergeTaxpayer(
                            taxpayer,
                            flattenTaxpayer(await client.selectCustomer(oscu, oscu.tin), oscu.tin, oscu.bhfId),
                        );
                    } catch {
                        // `/customerPinInfo` is the device taxpayer on Gava; ignore if unavailable.
                    }
                }

                if (!taxpayer?.taxprNm || !taxpayer.locDesc || !taxpayer.bhfNm) {
                    try {
                        const rows = extractBhfRows(await client.selectBhfList(oscu, input.lastReqDt));
                        const match =
                            rows.find((row) => pickStr(row, "bhfId") === oscu.bhfId) ??
                            rows[0];
                        if (match) {
                            taxpayer = mergeTaxpayer(taxpayer, taxpayerFromRecord(match, oscu.tin, oscu.bhfId));
                        }
                    } catch {
                        // Branch list is optional enrichment.
                    }
                }

                return {
                    success: true,
                    data: taxpayer ?? emptyTaxpayer(oscu.tin, oscu.bhfId),
                };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve taxpayer info" });
            }
        }),
});
