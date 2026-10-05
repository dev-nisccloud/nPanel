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
     * Retrieve standard code lists (payment types, receipt types, tax codes, etc.)
     * POST /selectCodeList
     */
    getCodeList: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();

            try {
                const result = await client.selectCodeList(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve code list" });
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

    /** POST /selectTaxPayerInfo */
    getTaxPayerInfo: etimsProcedure
        .input(z.object({
            lastReqDt: z.string().regex(/^\d{14}$/, "Must be YYYYMMDDHHmmss").default("20180101000000"),
        }))
        .query(async ({ ctx, input }) => {
            assertReadAccess(ctx.session?.user?.role);
            const { client, oscu } = await getEtimsContext();
            try {
                const result = await client.selectTaxPayerInfo(oscu, input.lastReqDt);
                return { success: true, data: result };
            } catch (error: unknown) {
                const msg = (error as Error).message;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg || "Failed to retrieve taxpayer info" });
            }
        }),
});
