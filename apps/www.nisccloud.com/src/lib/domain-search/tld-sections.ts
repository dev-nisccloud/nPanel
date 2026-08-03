import { categoryNameToSectionId } from "./domain-section-titles";
import { isKenicTld } from "./kenic-schema";

const POPULAR_TLDS = [
  "com", "net", "org", "info", "biz", "name", "pro", "io", "ai", "app",
  "dev", "tech", "online", "site", "store", "shop", "cloud", "digital",
  "me", "tv", "cc", "xyz", "co", "us", "uk", "ca", "au", "de",
];

const BUSINESS_TLDS = [
  "business", "company", "inc", "ltd", "llc", "gmbh", "sarl", "srl", "ltda",
  "enterprises", "holdings", "group", "team", "agency", "consulting", "management",
  "marketing", "services", "solutions", "systems", "ventures",
  "partners", "associates", "foundation", "ngo", "coop",
];

const EDUCATION_TLDS = [
  "education", "academy", "school", "university", "college", "institute",
  "science", "study", "courses", "training", "phd", "mba", "degree",
  "schule", "shiksha", "ac", "prof",
];

const INTERNATIONAL_TLDS = [
  "international", "global", "world", "earth", "asia", "africa",
  "country", "city", "town", "place", "zone",
  "eu", "eus", "cymru", "wales", "scot", "irish", "swiss", "vlaanderen",
  "saarland", "bayern", "nrw", "ruhr", "tirol", "corsica", "alsace",
];

const TECHNOLOGY_TLDS = [
  "tech", "technology", "digital", "cloud", "ai", "software", "systems",
  "solutions", "network", "net", "online", "app", "dev", "codes",
  "computer", "it", "ar", "ml",
];

const SOCIAL_PERSONAL_TLDS = [
  "social", "community", "network", "chat", "forum", "blog", "live", "stream",
  "fan", "fans", "family", "dating", "singles", "love", "life",
  "lifestyle", "me", "name", "id",
];

const PROFESSIONAL_SERVICES_TLDS = [
  "pro", "expert", "coach", "lawyer", "attorney", "legal", "law", "esq", "doctor", "health",
  "healthcare", "dental", "dentist", "physio", "clinic", "hospital",
  "vet", "accountant", "accountants", "financial", "finance", "bank",
  "insurance", "insure", "investments", "trading", "broker", "fund",
];

const MEDIA_ENTERTAINMENT_TLDS = [
  "media", "news", "press", "radio", "tv", "video", "film", "movie",
  "music", "audio", "stream", "live", "show", "theater",
  "theatre", "fun", "games", "sport",
  "football", "soccer", "basketball", "tennis", "golf", "hockey", "cricket",
  "rugby", "racing", "fitness", "yoga", "dance", "art", "gallery",
  "photo", "photography", "pics", "pictures", "camera", "studio",
];

const ECOMMERCE_SHOPPING_TLDS = [
  "shop", "shopping", "store", "market", "markets",
  "trade", "auction", "bid", "bargains",
  "deals", "discount", "cheap", "sale", "forsale", "coupons", "gift", "gifts",
];

const INDUSTRY_SECTOR_TLDS = [
  "auto", "autos", "car", "cars", "motorcycles", "boats", "yachts",
  "airforce", "navy", "army", "security", "protection",
  "energy", "solar", "green", "eco",
  "construction", "build", "builders", "contractors", "plumbing", "repair",
  "realestate", "realty", "property", "properties", "estate", "land",
  "house", "apartments", "condos", "rent", "rentals", "lease", "mortgage",
];

const LIFESTYLE_HOBBIES_TLDS = [
  "lifestyle", "life", "living", "homes", "house", "family", "kids",
  "baby", "mom", "dad", "men", "fashion", "beauty", "makeup", "hair",
  "clothing", "shoes", "jewelry", "watches", "luxury", "luxe", "rich", "vip",
  "food", "cooking", "recipes", "restaurant", "cafe", "coffee", "wine", "beer",
  "travel", "vacations", "tours", "cruises", "spa",
];

const COUNTRY_CODE_TLDS = [
  "us", "uk", "ca", "au", "de", "fr", "it", "es", "nl", "se", "no", "dk", "fi",
  "jp", "kr", "cn", "in", "br", "mx", "ar", "cl", "co", "pe", "ve", "ec",
  "ru", "pl", "cz", "hu", "ro", "bg", "hr", "si", "sk", "lt", "lv", "ee",
  "za", "ng", "eg", "ma", "tn", "dz", "ly", "sd", "et", "gh", "ci",
];

const CATEGORIES = [
  { name: "Popular", extensions: POPULAR_TLDS },
  { name: "Business", extensions: BUSINESS_TLDS },
  { name: "Education", extensions: EDUCATION_TLDS },
  { name: "International", extensions: INTERNATIONAL_TLDS },
  { name: "Technology", extensions: TECHNOLOGY_TLDS },
  { name: "Social & Personal", extensions: SOCIAL_PERSONAL_TLDS },
  { name: "Professional & Services", extensions: PROFESSIONAL_SERVICES_TLDS },
  { name: "Media & Entertainment", extensions: MEDIA_ENTERTAINMENT_TLDS },
  { name: "E-commerce & Shopping", extensions: ECOMMERCE_SHOPPING_TLDS },
  { name: "Industry & Sector", extensions: INDUSTRY_SECTOR_TLDS },
  { name: "Lifestyle & Hobbies", extensions: LIFESTYLE_HOBBIES_TLDS },
  { name: "Country Codes", extensions: COUNTRY_CODE_TLDS },
];

export function getTldExtensionsByCategory() {
  return CATEGORIES;
}

/** Kenyan TLDs always recommended first (via KENIC). */
export const RECOMMENDED_KENIC_TLDS = ["co.ke", "ke"] as const;

/**
 * Top OpenProvider TLDs we recommend after Kenyan ones.
 * Order is intentional and must be preserved in UI.
 */
export const RECOMMENDED_OPEN_TLDS = [
  "com",
  "net",
  "store",
  "app",
  "online",
  "site",
  "io",
] as const;

/** Extra popular OpenProvider TLDs loaded via "List more". */
export const MORE_POPULAR_OPEN_TLDS = [
  "org",
  "shop",
  "ai",
  "space",
  "studio",
  "live",
  "cloud",
  "me",
  "agency",
  "capital",
  "dev",
  "tech",
  "info",
  "biz",
  "xyz",
  "pro",
  "co",
  "africa",
] as const;

/** Full popular OpenProvider list (recommended + more), curated order. */
export const POPULAR_SECTION_EXTENSIONS = [
  ...RECOMMENDED_OPEN_TLDS,
  ...MORE_POPULAR_OPEN_TLDS.filter(
    (ext) => !(RECOMMENDED_OPEN_TLDS as readonly string[]).includes(ext),
  ),
];

const MORE_BATCH_SIZE = 8;

export type RecommendedBatch = {
  kenic: string[];
  open: string[];
  /** True when another List more batch exists after this one. */
  hasMore: boolean;
};

/**
 * Progressive batches for recommended domain search.
 * batch 0 = Kenic + top recommended OP TLDs
 * batch 1+ = next MORE_BATCH_SIZE from MORE_POPULAR_OPEN_TLDS
 */
export function getRecommendedBatch(batchIndex: number): RecommendedBatch {
  if (batchIndex <= 0) {
    return {
      kenic: [...RECOMMENDED_KENIC_TLDS],
      open: [...RECOMMENDED_OPEN_TLDS],
      hasMore: MORE_POPULAR_OPEN_TLDS.length > 0,
    };
  }

  const start = (batchIndex - 1) * MORE_BATCH_SIZE;
  const open = MORE_POPULAR_OPEN_TLDS.slice(start, start + MORE_BATCH_SIZE);
  return {
    kenic: [],
    open: [...open],
    hasMore: start + MORE_BATCH_SIZE < MORE_POPULAR_OPEN_TLDS.length,
  };
}

export function getExtensionsForSection(sectionId: string): string[] {
  if (sectionId === "popular") {
    return [...POPULAR_SECTION_EXTENSIONS];
  }

  if (sectionId === "all") {
    const seen = new Set<string>();
    for (const category of CATEGORIES) {
      for (const ext of category.extensions) {
        const e = ext.startsWith(".") ? ext.slice(1) : ext;
        if (!isKenicTld(e)) seen.add(e);
      }
    }
    return Array.from(seen);
  }

  const category = CATEGORIES.find((c) => categoryNameToSectionId(c.name) === sectionId);
  if (!category) return [];
  return category.extensions
    .map((ext) => (ext.startsWith(".") ? ext.slice(1) : ext))
    .filter((ext) => !isKenicTld(ext));
}

export const CATEGORY_PILLS: { sectionId: string; label: string }[] = [
  { sectionId: "popular", label: "Popular" },
  { sectionId: "kenyan", label: "Kenyan" },
  ...CATEGORIES.slice(1).map((c) => ({
    sectionId: categoryNameToSectionId(c.name),
    label: c.name,
  })),
];
