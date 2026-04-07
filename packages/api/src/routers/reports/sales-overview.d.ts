import type { SalesReportOverview } from "./sales-overview-schemas";
/** Build sales report overview from live data (no snapshot tables). */
export declare function computeSalesReportOverview(params: {
    from: Date;
    to: Date;
    monthsTrend: number;
    topTeamsLimit: number;
}): Promise<SalesReportOverview>;
