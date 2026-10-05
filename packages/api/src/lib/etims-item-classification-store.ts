import { and, asc, count, eq, ilike, max, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { eTimsItemClassification } from "@npanel/db/schema/etims";

import type { EtimsOscuClient, EtimsOscuHeaders } from "./etims-client";

export type EtimsItemClassification = {
    itemClsCd: string;
    itemClsNm: string;
    itemClsLvl: number;
    taxTyCd?: string | null;
    mjrTgYn?: string | null;
    useYn?: string | null;
};

export type EtimsItemClassMeta = {
    syncedAt: string;
    totalCount: number;
    levelCounts: Record<number, number>;
};

const SYNC_START = "20180101000000";
const KRA_PAGE_SIZE = 1000;
const INSERT_CHUNK_SIZE = 100;

function tokenizeClassificationSearch(raw: string): string[] {
    const compact = raw.replace(/[%_\\]/g, " ").replace(/\s+/g, " ").trim();
    if (!compact) return [];
    const tokens = compact
        .split(/[\s,;/|+]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
        .slice(0, 8);
    if (tokens.length) return tokens;
    return compact.length ? [compact] : [];
}

function tokenMatch(token: string) {
    return or(
        ilike(eTimsItemClassification.itemClsNm, `%${token}%`),
        ilike(eTimsItemClassification.itemClsCd, `%${token}%`),
    );
}

/** Each token must appear (partial) in name or code. Order does not matter. */
function classificationListWhere(level: number, search?: string) {
    const raw = search?.trim() ?? "";
    if (!raw) return eq(eTimsItemClassification.itemClsLvl, level);

    const digits = raw.replace(/[\s-]/g, "");
    if (/^\d{2,10}$/.test(digits) && !/[a-zA-Z]/.test(raw)) {
        return ilike(eTimsItemClassification.itemClsCd, `${digits}%`);
    }

    const tokens = tokenizeClassificationSearch(raw);
    if (!tokens.length) return eq(eTimsItemClassification.itemClsLvl, level);

    const clauses = tokens.map(tokenMatch);
    if (clauses.length === 1) return clauses[0]!;
    return and(...clauses);
}

function optionalText(value: unknown): string | null {
    if (value == null) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
}

function dedupeRows(rows: EtimsItemClassification[]): EtimsItemClassification[] {
    const byCode = new Map<string, EtimsItemClassification>();
    for (const row of rows) {
        byCode.set(row.itemClsCd, row);
    }
    return Array.from(byCode.values());
}

function inferItemClsLvl(code: string, rawLvl: unknown): number | null {
    const level = Number(rawLvl);
    if (Number.isFinite(level) && level >= 1 && level <= 5) return level;
    if (code.length === 2) return 1;
    if (code.length === 4) return 2;
    if (code.length === 6) return 3;
    if (code.length === 8) return 4;
    if (code.length === 10) return 5;
    return null;
}

function normalizeRow(raw: Record<string, unknown>): EtimsItemClassification | null {
    const code = String(raw.itemClsCd ?? "").trim();
    const name = String(raw.itemClsNm ?? "").trim();
    if (!code || !name) return null;

    const level = inferItemClsLvl(code, raw.itemClsLvl);
    if (level == null) return null;

    return {
        itemClsCd: code,
        itemClsNm: name,
        itemClsLvl: level,
        taxTyCd: optionalText(raw.taxTyCd),
        mjrTgYn: optionalText(raw.mjrTgYn),
        useYn: optionalText(raw.useYn) ?? "Y",
    };
}

function findItemClsList(root: unknown, depth = 0): unknown[] {
    if (depth > 6 || !root || typeof root !== "object") return [];
    const rec = root as Record<string, unknown>;
    if (Array.isArray(rec.itemClsList)) return rec.itemClsList;
    for (const key of ["data", "responseBody"]) {
        const nested = findItemClsList(rec[key], depth + 1);
        if (nested.length) return nested;
    }
    return [];
}

function extractKraPage(result: unknown): { rows: EtimsItemClassification[]; resultDt?: string; resultCd?: string; resultMsg?: string } {
    if (!result || typeof result !== "object") return { rows: [] };
    const root = result as Record<string, unknown>;
    const nested = (root.data && typeof root.data === "object" ? root.data : null) as Record<string, unknown> | null;
    const list = findItemClsList(root);
    const rows = list
        .map((row) => (row && typeof row === "object" ? normalizeRow(row as Record<string, unknown>) : null))
        .filter((row): row is EtimsItemClassification => row != null);
    const resultDt = typeof root.resultDt === "string"
        ? root.resultDt
        : typeof nested?.resultDt === "string"
            ? nested.resultDt
            : undefined;
    return {
        rows,
        resultDt,
        resultCd: typeof root.resultCd === "string" ? root.resultCd : undefined,
        resultMsg: typeof root.resultMsg === "string" ? root.resultMsg : undefined,
    };
}

async function clearAllClassifications() {
    await db.execute(sql`truncate table "etims_item_classification"`);
}

async function insertClassificationBatch(rows: EtimsItemClassification[]) {
    const uniqueRows = dedupeRows(rows);
    if (!uniqueRows.length) return;

    const syncedAt = new Date();
    for (let i = 0; i < uniqueRows.length; i += INSERT_CHUNK_SIZE) {
        const chunk = uniqueRows.slice(i, i + INSERT_CHUNK_SIZE);
        await db.insert(eTimsItemClassification).values(
            chunk.map((row) => ({
                itemClsCd: row.itemClsCd,
                itemClsNm: row.itemClsNm,
                itemClsLvl: row.itemClsLvl,
                taxTyCd: row.taxTyCd,
                mjrTgYn: row.mjrTgYn,
                useYn: row.useYn ?? "Y",
                syncedAt,
            })),
        ).onConflictDoUpdate({
            target: eTimsItemClassification.itemClsCd,
            set: {
                itemClsNm: sql`excluded.item_cls_nm`,
                itemClsLvl: sql`excluded.item_cls_lvl`,
                taxTyCd: sql`excluded.tax_ty_cd`,
                mjrTgYn: sql`excluded.mjr_tg_yn`,
                useYn: sql`excluded.use_yn`,
                syncedAt: sql`excluded.synced_at`,
            },
        });
    }
}

async function buildMeta(): Promise<EtimsItemClassMeta | null> {
    const [totalRow] = await db
        .select({ totalCount: count() })
        .from(eTimsItemClassification);

    const totalCount = Number(totalRow?.totalCount ?? 0);
    if (totalCount === 0) return null;

    const levelRows = await db
        .select({
            level: eTimsItemClassification.itemClsLvl,
            levelCount: count(),
        })
        .from(eTimsItemClassification)
        .groupBy(eTimsItemClassification.itemClsLvl);

    const [syncedRow] = await db
        .select({ syncedAt: max(eTimsItemClassification.syncedAt) })
        .from(eTimsItemClassification);

    const levelCounts: Record<number, number> = {};
    for (const row of levelRows) {
        if (row.level != null) levelCounts[row.level] = Number(row.levelCount);
    }

    return {
        syncedAt: syncedRow?.syncedAt?.toISOString() ?? new Date().toISOString(),
        totalCount,
        levelCounts,
    };
}

export function preferLocalItemClassifications(): boolean {
    return true;
}

function kraDateTimeFromDate(value: Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    const hh = String(value.getUTCHours()).padStart(2, "0");
    const mm = String(value.getUTCMinutes()).padStart(2, "0");
    const ss = String(value.getUTCSeconds()).padStart(2, "0");
    return `${y}${m}${d}${hh}${mm}${ss}`;
}

export async function getEtimsItemClassListFromDb() {
    const meta = await buildMeta();
    if (!meta) return null;

    return {
        resultCd: "000",
        resultMsg: "Success",
        resultDt: kraDateTimeFromDate(new Date(meta.syncedAt)),
        data: { itemClsList: [] as EtimsItemClassification[] },
        meta,
    };
}

export async function getEtimsItemClassMeta(_oscu: EtimsOscuHeaders): Promise<EtimsItemClassMeta | null> {
    return buildMeta();
}

export async function getEtimsItemClassificationByCode(
    _oscu: EtimsOscuHeaders,
    itemClsCd: string,
): Promise<EtimsItemClassification | null> {
    const code = itemClsCd?.trim();
    if (!code) return null;

    const [row] = await db
        .select({
            itemClsCd: eTimsItemClassification.itemClsCd,
            itemClsNm: eTimsItemClassification.itemClsNm,
            itemClsLvl: eTimsItemClassification.itemClsLvl,
            taxTyCd: eTimsItemClassification.taxTyCd,
            mjrTgYn: eTimsItemClassification.mjrTgYn,
            useYn: eTimsItemClassification.useYn,
        })
        .from(eTimsItemClassification)
        .where(eq(eTimsItemClassification.itemClsCd, code))
        .limit(1);
    if (!row) return null;

    return row;
}

export async function listEtimsItemClassifications(
    _oscu: EtimsOscuHeaders,
    input: { level: number; search?: string; page: number; pageSize: number },
) {
    const meta = await buildMeta();
    if (!meta) {
        return {
            items: [] as EtimsItemClassification[],
            total: 0,
            page: input.page,
            pageSize: input.pageSize,
            totalPages: 0,
            needsSync: true,
            empty: true,
        };
    }

    const where = classificationListWhere(input.level, input.search);

    const [totalRow] = await db
        .select({ total: count() })
        .from(eTimsItemClassification)
        .where(where);

    const total = Number(totalRow?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / input.pageSize);
    const page = Math.max(input.page, 1);
    if (totalPages > 0 && page > totalPages) {
        return {
            items: [] as EtimsItemClassification[],
            total,
            page,
            pageSize: input.pageSize,
            totalPages,
            needsSync: false,
            empty: false,
        };
    }
    const offset = (page - 1) * input.pageSize;

    const rows = await db
        .select({
            itemClsCd: eTimsItemClassification.itemClsCd,
            itemClsNm: eTimsItemClassification.itemClsNm,
            itemClsLvl: eTimsItemClassification.itemClsLvl,
            taxTyCd: eTimsItemClassification.taxTyCd,
            mjrTgYn: eTimsItemClassification.mjrTgYn,
            useYn: eTimsItemClassification.useYn,
        })
        .from(eTimsItemClassification)
        .where(where)
        .orderBy(asc(eTimsItemClassification.itemClsCd))
        .limit(input.pageSize)
        .offset(offset);

    return {
        items: rows,
        total,
        page,
        pageSize: input.pageSize,
        totalPages,
        needsSync: false,
        empty: false,
    };
}

export async function syncEtimsItemClassificationsBatch(
    client: EtimsOscuClient,
    _oscu: EtimsOscuHeaders,
    input: { lastReqDt?: string; maxPages?: number; reset?: boolean },
) {
    const maxPages = input.maxPages ?? 3;

    if (input.reset) {
        await clearAllClassifications();
    }

    let lastReqDt = input.lastReqDt ?? SYNC_START;
    let pagesFetched = 0;
    let rowsFetched = 0;
    let hasMore = false;
    let nextLastReqDt = lastReqDt;

    while (pagesFetched < maxPages) {
        const result = await client.selectItemClsList(_oscu, lastReqDt);
        const { rows, resultDt, resultCd, resultMsg } = extractKraPage(result);
        if (resultCd && resultCd !== "000" && resultCd !== "001") {
            throw new Error(resultMsg || `KRA selectItemClsList failed (${resultCd})`);
        }
        if (!rows.length) break;

        await insertClassificationBatch(rows);
        rowsFetched += rows.length;
        pagesFetched++;

        if (rows.length < KRA_PAGE_SIZE || !resultDt) {
            hasMore = false;
            nextLastReqDt = resultDt ?? lastReqDt;
            break;
        }

        hasMore = true;
        nextLastReqDt = resultDt;
        lastReqDt = resultDt;
    }

    const meta = await buildMeta();
    const [totalRow] = await db
        .select({ total: count() })
        .from(eTimsItemClassification);

    return {
        pagesFetched,
        rowsFetched,
        hasMore,
        nextLastReqDt,
        totalSynced: Number(totalRow?.total ?? 0),
        isComplete: !hasMore && !!meta,
        meta,
    };
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncAllEtimsItemClassifications(
    client: EtimsOscuClient,
    oscu: EtimsOscuHeaders,
    input: {
        lastReqDt?: string;
        reset?: boolean;
        sleepMs?: number;
        onProgress?: (progress: {
            pagesFetched: number;
            rowsFetched: number;
            totalSynced: number;
            nextLastReqDt: string;
            hasMore: boolean;
        }) => void;
    } = {},
) {
    let lastReqDt = input.lastReqDt;
    let reset = input.reset ?? false;
    let pagesFetched = 0;
    let rowsFetched = 0;
    let nextLastReqDt = lastReqDt ?? SYNC_START;
    let hasMore = true;
    let meta = await buildMeta();

    while (hasMore) {
        const batch = await syncEtimsItemClassificationsBatch(client, oscu, {
            lastReqDt: nextLastReqDt,
            maxPages: 5,
            reset,
        });
        reset = false;
        pagesFetched += batch.pagesFetched;
        rowsFetched += batch.rowsFetched;
        nextLastReqDt = batch.nextLastReqDt;
        hasMore = batch.hasMore;
        meta = batch.meta;

        input.onProgress?.({
            pagesFetched,
            rowsFetched,
            totalSynced: batch.totalSynced,
            nextLastReqDt,
            hasMore,
        });

        if (!batch.pagesFetched) break;
        if (hasMore && (input.sleepMs ?? 200) > 0) {
            await sleep(input.sleepMs ?? 200);
        }
    }

    return {
        pagesFetched,
        rowsFetched,
        hasMore: false,
        nextLastReqDt,
        totalSynced: meta?.totalCount ?? 0,
        isComplete: !!meta,
        meta,
    };
}
