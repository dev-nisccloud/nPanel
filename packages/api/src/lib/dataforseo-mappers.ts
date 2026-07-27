/**
 * Data transformation layer for DataForSEO API responses.
 * Maps raw nested API responses to clean, typed domain objects.
 */

type DataForSEOMetrics = {
  organic?: {
    pos_1?: number;
    pos_2_3?: number;
    pos_4_10?: number;
    pos_11_20?: number;
    pos_21_30?: number;
    pos_31_40?: number;
    pos_41_50?: number;
    pos_51_60?: number;
    pos_61_70?: number;
    pos_71_80?: number;
    pos_81_90?: number;
    pos_91_100?: number;
    etv?: number;
    count?: number;
    estimated_paid_traffic_cost?: number;
    is_new?: number;
    is_up?: number;
    is_down?: number;
    is_lost?: number;
  };
  paid?: {
    count?: number;
    etv?: number;
  };
};

type DataForSEORankOverviewItem = {
  se_type?: string;
  location_code?: number;
  language_code?: string;
  metrics?: DataForSEOMetrics;
};

type DataForSEOKeywordInfo = {
  search_volume?: number;
  cpc?: number;
  competition?: number;
  keyword_difficulty?: number;
};

type DataForSEOKeywordData = {
  keyword?: string;
  keyword_info?: DataForSEOKeywordInfo;
  keyword_properties?: {
    keyword_difficulty?: number;
  };
};

type DataForSEORankedSerpElement = {
  serp_item?: {
    rank_absolute?: number;
    rank_group?: number;
    url?: string;
    etv?: number;
  };
  rank_absolute?: number;
  etv?: number;
  url?: string;
};

type DataForSEORankedKeywordItem = {
  keyword?: string;
  keyword_data?: DataForSEOKeywordData;
  ranked_serp_element?: DataForSEORankedSerpElement;
};

type DataForSEOPageItem = {
  page_address?: string;
  metrics?: DataForSEOMetrics;
};

export type DomainOverviewMetrics = {
  organicTraffic: number | null;
  organicKeywords: number | null;
  pos1Count: number | null;
  pos2_3Count: number | null;
  pos4_10Count: number | null;
  pos11_20Count: number | null;
  hasData: boolean;
};

export type RankedKeywordResult = {
  keyword: string;
  position: number | null;
  searchVolume: number | null;
  traffic: number | null;
  cpc: number | null;
  keywordDifficulty: number | null;
  url: string | null;
};

export type PageResult = {
  pageAddress: string;
  keywordCount: number | null;
  traffic: number | null;
};

export type DomainOverviewTransformed = {
  target: string;
  metrics: DomainOverviewMetrics;
  rankedKeywords: RankedKeywordResult[];
  pages: PageResult[];
  capturedAt: Date;
};

/**
 * Extracts metrics from DataForSEO rank overview response
 */
export function mapDomainOverviewMetrics(
  items: DataForSEORankOverviewItem[] | undefined | null,
): DomainOverviewMetrics {
  const item = items?.[0];
  const organicMetrics = item?.metrics?.organic;

  const organicTraffic =
    organicMetrics?.etv != null ? Math.round(organicMetrics.etv) : null;
  const organicKeywords =
    organicMetrics?.count != null ? Math.round(organicMetrics.count) : null;
  const pos1Count = organicMetrics?.pos_1 ?? null;
  const pos2_3Count = organicMetrics?.pos_2_3 ?? null;
  const pos4_10Count = organicMetrics?.pos_4_10 ?? null;
  const pos11_20Count = organicMetrics?.pos_11_20 ?? null;

  return {
    organicTraffic,
    organicKeywords,
    pos1Count,
    pos2_3Count,
    pos4_10Count,
    pos11_20Count,
    hasData: organicKeywords != null && organicKeywords > 0,
  };
}

/**
 * Maps a single ranked keyword item from DataForSEO to our domain model
 */
export function mapRankedKeyword(
  item: DataForSEORankedKeywordItem,
): RankedKeywordResult | null {
  const keywordData = item.keyword_data;
  const keywordInfo = keywordData?.keyword_info;
  const keywordProperties = keywordData?.keyword_properties;
  const rankedSerpElement = item.ranked_serp_element;
  const serpItem = rankedSerpElement?.serp_item;

  const keyword = keywordData?.keyword ?? item.keyword;
  if (!keyword) return null;

  const position =
    serpItem?.rank_absolute ?? rankedSerpElement?.rank_absolute ?? null;
  const traffic = serpItem?.etv ?? rankedSerpElement?.etv ?? null;
  const url = serpItem?.url ?? rankedSerpElement?.url ?? null;

  const keywordDifficulty =
    keywordProperties?.keyword_difficulty ?? keywordInfo?.keyword_difficulty ?? null;

  return {
    keyword,
    position: position != null ? Math.round(position) : null,
    searchVolume:
      keywordInfo?.search_volume != null ? Math.round(keywordInfo.search_volume) : null,
    traffic: traffic ?? null,
    cpc: keywordInfo?.cpc ?? null,
    keywordDifficulty: keywordDifficulty != null ? Math.round(keywordDifficulty) : null,
    url,
  };
}

/**
 * Maps ranked keywords array from DataForSEO response
 */
export function mapRankedKeywords(
  items: DataForSEORankedKeywordItem[] | undefined | null,
): RankedKeywordResult[] {
  if (!items || !Array.isArray(items)) return [];

  return items
    .map(mapRankedKeyword)
    .filter((item): item is RankedKeywordResult => item !== null);
}

/**
 * Maps a single page item from DataForSEO to our domain model
 */
export function mapPageItem(item: DataForSEOPageItem): PageResult | null {
  const pageAddress = item.page_address;
  if (!pageAddress) return null;

  const keywordCount =
    item.metrics?.organic?.count != null
      ? Math.round(item.metrics.organic.count)
      : null;
  const traffic =
    item.metrics?.organic?.etv != null ? Math.round(item.metrics.organic.etv) : null;

  return {
    pageAddress,
    keywordCount,
    traffic,
  };
}

/**
 * Maps pages array from DataForSEO response
 */
export function mapPages(
  items: DataForSEOPageItem[] | undefined | null,
): PageResult[] {
  if (!items || !Array.isArray(items)) return [];

  return items
    .map(mapPageItem)
    .filter((item): item is PageResult => item !== null);
}

/**
 * Main transformation function: converts raw DataForSEO domain overview response
 * to our clean domain model
 */
export function transformDomainOverview(rawPayload: {
  overview?: unknown[];
  ranked?: unknown[];
  pages?: unknown[];
  target: string;
}): DomainOverviewTransformed {
  // Extract items from DataForSEO response structure
  const overviewItems = (rawPayload.overview?.[0] as { items?: DataForSEORankOverviewItem[] })
    ?.items;
  const rankedItems = (rawPayload.ranked?.[0] as { items?: DataForSEORankedKeywordItem[] })
    ?.items;
  const pagesItems = (rawPayload.pages?.[0] as { items?: DataForSEOPageItem[] })?.items;

  return {
    target: rawPayload.target,
    metrics: mapDomainOverviewMetrics(overviewItems),
    rankedKeywords: mapRankedKeywords(rankedItems),
    pages: mapPages(pagesItems),
    capturedAt: new Date(),
  };
}
