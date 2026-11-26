import { and, asc, count, eq, ilike, max, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { eTimsCode } from "@npanel/db/schema/etims";

import type { EtimsOscuClient, EtimsOscuHeaders } from "./etims-client";

export type EtimsCodeRow = {
	cdCls: string;
	cdClsNm: string;
	cd: string;
	cdNm: string;
	useYn: string;
};

export type EtimsCodeClassSummary = {
	cdCls: string;
	cdClsNm: string;
	count: number;
};

export type EtimsCodeMeta = {
	syncedAt: string;
	totalCount: number;
	classCounts: EtimsCodeClassSummary[];
};

const SYNC_START = "20180101000000";
const INSERT_CHUNK_SIZE = 100;

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function listOf(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function optionalText(value: unknown): string {
	if (value == null) return "";
	return String(value).trim();
}

function normalizeRow(raw: {
	cdCls?: unknown;
	cdClsNm?: unknown;
	cd?: unknown;
	cdNm?: unknown;
	useYn?: unknown;
}): EtimsCodeRow | null {
	const cdCls = optionalText(raw.cdCls);
	const cd = optionalText(raw.cd);
	const cdNm = optionalText(raw.cdNm);
	if (!cdCls || !cd) return null;
	return {
		cdCls,
		cdClsNm: optionalText(raw.cdClsNm) || cdCls,
		cd,
		cdNm: cdNm || cd,
		useYn: optionalText(raw.useYn) === "N" ? "N" : "Y",
	};
}

function findCodePayload(root: unknown, depth = 0): Record<string, unknown> | null {
	if (depth > 6 || !root || typeof root !== "object") return null;
	const rec = root as Record<string, unknown>;
	if (Array.isArray(rec.clsList) || Array.isArray(rec.codeList)) return rec;
	for (const key of ["data", "responseBody"]) {
		const nested = findCodePayload(rec[key], depth + 1);
		if (nested) return nested;
	}
	return rec;
}

export function flattenEtimsCodeList(root: unknown): EtimsCodeRow[] {
	const data = findCodePayload(root) ?? {};
	const rows: EtimsCodeRow[] = [];
	const seen = new Set<string>();

	const push = (row: EtimsCodeRow | null) => {
		if (!row) return;
		const key = `${row.cdCls}:${row.cd}`;
		if (seen.has(key)) return;
		seen.add(key);
		rows.push(row);
	};

	for (const cls of listOf(data.clsList)) {
		const c = asRecord(cls);
		if (!c) continue;
		const details = listOf(c.dtllist ?? c.dtlList ?? c.codeList);
		if (details.length === 0 && c.cd) {
			push(normalizeRow({
				cdCls: c.cdCls,
				cdClsNm: c.cdClsNm,
				cd: c.cd,
				cdNm: c.cdNm,
				useYn: c.useYn,
			}));
			continue;
		}
		for (const d of details) {
			const row = asRecord(d);
			if (!row) continue;
			push(normalizeRow({
				cdCls: c.cdCls ?? row.cdCls,
				cdClsNm: c.cdClsNm ?? row.cdClsNm,
				cd: row.cd,
				cdNm: row.cdNm,
				useYn: row.useYn,
			}));
		}
	}

	for (const d of listOf(data.codeList)) {
		const row = asRecord(d);
		if (!row) continue;
		push(normalizeRow(row));
	}

	return rows;
}

function extractKraCodes(result: unknown): {
	rows: EtimsCodeRow[];
	resultCd?: string;
	resultMsg?: string;
} {
	if (!result || typeof result !== "object") return { rows: [] };
	const root = result as Record<string, unknown>;
	const nested = asRecord(root.data);
	return {
		rows: flattenEtimsCodeList(result),
		resultCd: typeof root.resultCd === "string" ? root.resultCd : undefined,
		resultMsg:
			typeof root.resultMsg === "string"
				? root.resultMsg
				: typeof nested?.resultMsg === "string"
					? nested.resultMsg
					: undefined,
	};
}

async function insertCodeBatch(
	rows: EtimsCodeRow[],
	tx: Pick<typeof db, "insert"> = db,
) {
	if (!rows.length) return;
	const syncedAt = new Date();
	for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
		const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE);
		await tx
			.insert(eTimsCode)
			.values(
				chunk.map((row) => ({
					cdCls: row.cdCls,
					cdClsNm: row.cdClsNm,
					cd: row.cd,
					cdNm: row.cdNm,
					useYn: row.useYn,
					syncedAt,
				})),
			)
			.onConflictDoUpdate({
				target: [eTimsCode.cdCls, eTimsCode.cd],
				set: {
					cdClsNm: sql`excluded.cd_cls_nm`,
					cdNm: sql`excluded.cd_nm`,
					useYn: sql`excluded.use_yn`,
					syncedAt: sql`excluded.synced_at`,
				},
			});
	}
}

async function buildMeta(): Promise<EtimsCodeMeta | null> {
	const [totalRow] = await db.select({ totalCount: count() }).from(eTimsCode);
	const totalCount = Number(totalRow?.totalCount ?? 0);
	if (totalCount === 0) return null;

	const classRows = await db
		.select({
			cdCls: eTimsCode.cdCls,
			cdClsNm: eTimsCode.cdClsNm,
			classCount: count(),
		})
		.from(eTimsCode)
		.groupBy(eTimsCode.cdCls, eTimsCode.cdClsNm)
		.orderBy(asc(eTimsCode.cdCls));

	const [syncedRow] = await db.select({ syncedAt: max(eTimsCode.syncedAt) }).from(eTimsCode);

	return {
		syncedAt: syncedRow?.syncedAt?.toISOString() ?? new Date().toISOString(),
		totalCount,
		classCounts: classRows.map((row) => ({
			cdCls: row.cdCls,
			cdClsNm: row.cdClsNm || row.cdCls,
			count: Number(row.classCount),
		})),
	};
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

export function codesToKraClsList(rows: EtimsCodeRow[]) {
	const byClass = new Map<string, { cdCls: string; cdClsNm: string; dtllist: EtimsCodeRow[] }>();
	for (const row of rows) {
		const current = byClass.get(row.cdCls) ?? {
			cdCls: row.cdCls,
			cdClsNm: row.cdClsNm,
			dtllist: [] as EtimsCodeRow[],
		};
		current.dtllist.push(row);
		byClass.set(row.cdCls, current);
	}
	return [...byClass.values()];
}

export async function getEtimsCodeListFromDb() {
	const meta = await buildMeta();
	if (!meta) return null;
	const rows = await db
		.select({
			cdCls: eTimsCode.cdCls,
			cdClsNm: eTimsCode.cdClsNm,
			cd: eTimsCode.cd,
			cdNm: eTimsCode.cdNm,
			useYn: eTimsCode.useYn,
		})
		.from(eTimsCode)
		.orderBy(asc(eTimsCode.cdCls), asc(eTimsCode.cd));

	const normalized = rows.map((row) => ({
		cdCls: row.cdCls,
		cdClsNm: row.cdClsNm,
		cd: row.cd,
		cdNm: row.cdNm,
		useYn: row.useYn === "N" ? "N" : "Y",
	}));

	return {
		resultCd: "000",
		resultMsg: "Success",
		resultDt: kraDateTimeFromDate(new Date(meta.syncedAt)),
		data: {
			clsList: codesToKraClsList(normalized),
			codeList: normalized,
		},
		meta,
	};
}

export async function getEtimsCodeMeta(): Promise<EtimsCodeMeta | null> {
	return buildMeta();
}

export async function listEtimsCodes(input: {
	cdCls?: string;
	search?: string;
	includeUnused?: boolean;
}) {
	const meta = await buildMeta();
	if (!meta) {
		return {
			items: [] as EtimsCodeRow[],
			classes: [] as EtimsCodeClassSummary[],
			total: 0,
			needsSync: true,
			empty: true,
			meta: null as EtimsCodeMeta | null,
		};
	}

	const filters = [];
	if (input.cdCls) filters.push(eq(eTimsCode.cdCls, input.cdCls));
	if (!input.includeUnused) filters.push(eq(eTimsCode.useYn, "Y"));
	const search = input.search?.trim();
	if (search) {
		const like = `%${search.replace(/[%_]/g, " ").trim()}%`;
		filters.push(
			or(
				ilike(eTimsCode.cd, like),
				ilike(eTimsCode.cdNm, like),
				ilike(eTimsCode.cdCls, like),
				ilike(eTimsCode.cdClsNm, like),
			),
		);
	}
	const where = filters.length ? and(...filters) : undefined;

	const rows = await db
		.select({
			cdCls: eTimsCode.cdCls,
			cdClsNm: eTimsCode.cdClsNm,
			cd: eTimsCode.cd,
			cdNm: eTimsCode.cdNm,
			useYn: eTimsCode.useYn,
		})
		.from(eTimsCode)
		.where(where)
		.orderBy(asc(eTimsCode.cdCls), asc(eTimsCode.cd));

	return {
		items: rows.map((row) => ({
			cdCls: row.cdCls,
			cdClsNm: row.cdClsNm,
			cd: row.cd,
			cdNm: row.cdNm,
			useYn: row.useYn === "N" ? "N" : "Y",
		})),
		classes: meta.classCounts,
		total: rows.length,
		needsSync: false,
		empty: false,
		meta,
	};
}

export async function syncEtimsCodeList(
	client: EtimsOscuClient,
	oscu: EtimsOscuHeaders,
	input: { lastReqDt?: string; reset?: boolean } = {},
) {
	const lastReqDt = input.lastReqDt ?? SYNC_START;
	const result = await client.selectCodeList(oscu, lastReqDt);
	const { rows, resultCd, resultMsg } = extractKraCodes(result);
	if (resultCd && resultCd !== "000" && resultCd !== "001") {
		throw new Error(resultMsg || `KRA selectCodeList failed (${resultCd})`);
	}
	if (!rows.length) {
		const meta = await buildMeta();
		if (!meta) {
			throw new Error("KRA returned no standard codes. Check device init and ETIMS env.");
		}
		return {
			rowsFetched: 0,
			totalSynced: meta.totalCount,
			isComplete: true,
			meta,
		};
	}

	await db.transaction(async (tx) => {
		if (input.reset) {
			await tx.delete(eTimsCode);
		}
		await insertCodeBatch(rows, tx);
	});

	const meta = await buildMeta();
	return {
		rowsFetched: rows.length,
		totalSynced: meta?.totalCount ?? 0,
		isComplete: !!meta,
		meta,
	};
}
