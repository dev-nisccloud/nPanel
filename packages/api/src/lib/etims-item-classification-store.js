import { and, asc, count, eq, ilike, max, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { eTimsItemClassification } from "@npanel/db/schema/etims";
const SYNC_START = "20180101000000";
const KRA_PAGE_SIZE = 1000;
const INSERT_CHUNK_SIZE = 100;
function optionalText(value) {
    if (value == null)
        return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
}
function tokenizeClassificationSearch(raw) {
    const compact = raw.replace(/[%_\\]/g, " ").replace(/\s+/g, " ").trim();
    if (!compact)
        return [];
    const tokens = compact
        .split(/[\s,;/|+]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
        .slice(0, 8);
    if (tokens.length)
        return tokens;
    return compact.length ? [compact] : [];
}
function tokenMatch(token) {
    return or(ilike(eTimsItemClassification.itemClsNm, `%${token}%`), ilike(eTimsItemClassification.itemClsCd, `%${token}%`));
}
function classificationListWhere(level, search) {
    const raw = search?.trim() ?? "";
    if (!raw)
        return eq(eTimsItemClassification.itemClsLvl, level);
    const digits = raw.replace(/[\s-]/g, "");
    if (/^\d{2,10}$/.test(digits) && !/[a-zA-Z]/.test(raw)) {
        return ilike(eTimsItemClassification.itemClsCd, `${digits}%`);
    }
    const tokens = tokenizeClassificationSearch(raw);
    if (!tokens.length)
        return eq(eTimsItemClassification.itemClsLvl, level);
    const clauses = tokens.map(tokenMatch);
    if (clauses.length === 1)
        return clauses[0];
    return and(...clauses);
}
function dedupeRows(rows) {
    const byCode = new Map();
    for (const row of rows) {
        byCode.set(row.itemClsCd, row);
    }
    return Array.from(byCode.values());
}
function inferItemClsLvl(code, rawLvl) {
    const level = Number(rawLvl);
    if (Number.isFinite(level) && level >= 1 && level <= 5)
        return level;
    if (code.length === 2)
        return 1;
    if (code.length === 4)
        return 2;
    if (code.length === 6)
        return 3;
    if (code.length === 8)
        return 4;
    if (code.length === 10)
        return 5;
    return null;
}
function normalizeRow(raw) {
    const code = String(raw.itemClsCd ?? "").trim();
    const name = String(raw.itemClsNm ?? "").trim();
    if (!code || !name)
        return null;
    const level = inferItemClsLvl(code, raw.itemClsLvl);
    if (level == null)
        return null;
    return {
        itemClsCd: code,
        itemClsNm: name,
        itemClsLvl: level,
        taxTyCd: optionalText(raw.taxTyCd),
        mjrTgYn: optionalText(raw.mjrTgYn),
        useYn: optionalText(raw.useYn) ?? "Y",
    };
}
function findItemClsList(root, depth = 0) {
    if (depth > 6 || !root || typeof root !== "object")
        return [];
    if (Array.isArray(root.itemClsList))
        return root.itemClsList;
    for (const key of ["data", "responseBody"]) {
        const nested = findItemClsList(root[key], depth + 1);
        if (nested.length)
            return nested;
    }
    return [];
}
function extractKraPage(result) {
    if (!result || typeof result !== "object")
        return { rows: [] };
    const nested = (result.data && typeof result.data === "object") ? result.data : null;
    const list = findItemClsList(result);
    const rows = list
        .map((row) => (row && typeof row === "object" ? normalizeRow(row) : null))
        .filter((row) => row != null);
    const resultDt = typeof result.resultDt === "string"
        ? result.resultDt
        : typeof nested?.resultDt === "string"
            ? nested.resultDt
            : undefined;
    return {
        rows,
        resultDt,
        resultCd: typeof result.resultCd === "string" ? result.resultCd : undefined,
        resultMsg: typeof result.resultMsg === "string" ? result.resultMsg : undefined,
    };
}
async function clearAllClassifications() {
    await db.execute(sql `truncate table "etims_item_classification"`);
}
async function insertClassificationBatch(rows) {
    const uniqueRows = dedupeRows(rows);
    if (!uniqueRows.length)
        return;
    const syncedAt = new Date();
    for (let i = 0; i < uniqueRows.length; i += INSERT_CHUNK_SIZE) {
        const chunk = uniqueRows.slice(i, i + INSERT_CHUNK_SIZE);
        await db.insert(eTimsItemClassification).values(chunk.map((row) => ({
            itemClsCd: row.itemClsCd,
            itemClsNm: row.itemClsNm,
            itemClsLvl: row.itemClsLvl,
            taxTyCd: row.taxTyCd,
            mjrTgYn: row.mjrTgYn,
            useYn: row.useYn ?? "Y",
            syncedAt,
        }))).onConflictDoUpdate({
            target: eTimsItemClassification.itemClsCd,
            set: {
                itemClsNm: sql `excluded.item_cls_nm`,
                itemClsLvl: sql `excluded.item_cls_lvl`,
                taxTyCd: sql `excluded.tax_ty_cd`,
                mjrTgYn: sql `excluded.mjr_tg_yn`,
                useYn: sql `excluded.use_yn`,
                syncedAt: sql `excluded.synced_at`,
            },
        });
    }
}
async function buildMeta() {
    const [totalRow] = await db
        .select({ totalCount: count() })
        .from(eTimsItemClassification);
    const totalCount = Number(totalRow?.totalCount ?? 0);
    if (totalCount === 0)
        return null;
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
    const levelCounts = {};
    for (const row of levelRows) {
        if (row.level != null)
            levelCounts[row.level] = Number(row.levelCount);
    }
    return {
        syncedAt: syncedRow?.syncedAt?.toISOString() ?? new Date().toISOString(),
        totalCount,
        levelCounts,
    };
}
export function preferLocalItemClassifications() {
    return true;
}
function kraDateTimeFromDate(value) {
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
    if (!meta)
        return null;
    return {
        resultCd: "000",
        resultMsg: "Success",
        resultDt: kraDateTimeFromDate(new Date(meta.syncedAt)),
        data: { itemClsList: [] },
        meta,
    };
}
export async function getEtimsItemClassMeta(_oscu) {
    return buildMeta();
}
export async function getEtimsItemClassificationByCode(_oscu, itemClsCd) {
    const code = itemClsCd?.trim();
    if (!code)
        return null;
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
    if (!row)
        return null;
    return row;
}
export async function listEtimsItemClassifications(_oscu, input) {
    const meta = await buildMeta();
    if (!meta) {
        return {
            items: [],
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
            items: [],
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
export async function syncEtimsItemClassificationsBatch(client, _oscu, input) {
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
        if (!rows.length)
            break;
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
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function syncAllEtimsItemClassifications(client, oscu, input = {}) {
    let reset = input.reset ?? false;
    let pagesFetched = 0;
    let rowsFetched = 0;
    let nextLastReqDt = input.lastReqDt ?? SYNC_START;
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
        if (!batch.pagesFetched)
            break;
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
