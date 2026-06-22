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
function dedupeRows(rows) {
    const byCode = new Map();
    for (const row of rows) {
        byCode.set(row.itemClsCd, row);
    }
    return Array.from(byCode.values());
}
function normalizeRow(raw) {
    const itemClsCd = raw.itemClsCd;
    const itemClsNm = raw.itemClsNm;
    const itemClsLvl = raw.itemClsLvl;
    if (!itemClsCd || !itemClsNm || itemClsLvl == null)
        return null;
    const level = Number(itemClsLvl);
    if (!Number.isFinite(level) || level < 1 || level > 5)
        return null;
    const code = String(itemClsCd).trim();
    const name = String(itemClsNm).trim();
    if (!code || !name)
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
function extractKraPage(result) {
    if (!result || typeof result !== "object")
        return { rows: [] };
    const root = result;
    const data = root.data;
    const list = data && typeof data === "object"
        ? data.itemClsList
        : undefined;
    const rows = Array.isArray(list)
        ? list
            .map((row) => normalizeRow(row))
            .filter((row) => row != null)
        : [];
    const resultDt = typeof root.resultDt === "string" ? root.resultDt : undefined;
    return { rows, resultDt };
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
export async function getEtimsItemClassMeta(_oscu) {
    return buildMeta();
}
export async function getEtimsItemClassificationByCode(_oscu, itemClsCd) {
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
        .where(eq(eTimsItemClassification.itemClsCd, itemClsCd.trim()))
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
        };
    }
    const term = input.search?.trim();
    const where = term
        ? and(eq(eTimsItemClassification.itemClsLvl, input.level), or(ilike(eTimsItemClassification.itemClsCd, `%${term}%`), ilike(eTimsItemClassification.itemClsNm, `%${term}%`)))
        : eq(eTimsItemClassification.itemClsLvl, input.level);
    const [totalRow] = await db
        .select({ total: count() })
        .from(eTimsItemClassification)
        .where(where);
    const total = Number(totalRow?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / input.pageSize);
    const page = Math.min(Math.max(input.page, 1), Math.max(totalPages, 1));
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
        const { rows, resultDt } = extractKraPage(result);
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
