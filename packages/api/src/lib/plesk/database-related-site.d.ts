export type RelatedSite = {
    id: number;
    name: string;
};
/**
 * Database id → Plesk "Related to" site. Missing key means unconnected.
 */
export declare function getRelatedSitesByDatabaseId(webspaceId: number): Promise<Record<string, RelatedSite>>;
