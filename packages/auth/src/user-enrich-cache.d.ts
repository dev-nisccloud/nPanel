export type CachedUserEnrichment = {
    status: string;
    role: string;
    lastAccessedTeamId: string | null;
    createdAt: string;
    image: string | null;
};
export declare function readCachedUserEnrichment(userId: string): Promise<CachedUserEnrichment | null>;
export declare function writeCachedUserEnrichment(userId: string, row: {
    status: string;
    role: string;
    lastAccessedTeamId: string | null;
    createdAt: Date;
    image: string | null;
}): Promise<void>;
export declare function invalidateUserEnrichmentCache(userId: string): Promise<void>;
