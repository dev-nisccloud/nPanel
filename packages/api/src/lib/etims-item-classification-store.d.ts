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
export declare function getEtimsItemClassMeta(_oscu: EtimsOscuHeaders): Promise<EtimsItemClassMeta | null>;
export declare function getEtimsItemClassificationByCode(_oscu: EtimsOscuHeaders, itemClsCd: string): Promise<EtimsItemClassification | null>;
export declare function listEtimsItemClassifications(_oscu: EtimsOscuHeaders, input: {
    level: number;
    search?: string;
    page: number;
    pageSize: number;
}): Promise<{
    items: EtimsItemClassification[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    needsSync: boolean;
}>;
export declare function syncEtimsItemClassificationsBatch(client: EtimsOscuClient, _oscu: EtimsOscuHeaders, input: {
    lastReqDt?: string;
    maxPages?: number;
    reset?: boolean;
}): Promise<{
    pagesFetched: number;
    rowsFetched: number;
    hasMore: boolean;
    nextLastReqDt: string;
    totalSynced: number;
    isComplete: boolean;
    meta: EtimsItemClassMeta | null;
}>;
