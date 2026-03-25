/**
 * Comprehensive list of Top Level Domain (TLD) extensions
 * This utility provides access to 745+ supported TLD extensions
 * for domain registration and availability checking.
 */

// TLD extensions data - sourced from tlds.txt
const TLD_EXTENSIONS = [
  "abogado",
  "ac",
  "academy",
  "accountant",
  "accountants",
  "actor",
  "ad",
  "adult",
  "ae",
  "aero",
  "af",
  "africa",
  "ag",
  "agency",
  "ai",
  "airforce",
  "al",
  "alsace",
  "am",
  "amsterdam",
  "ao",
  "apartments",
  "app",
  "aq",
  "ar",
  "archi",
  "army",
  "art",
  "as",
  "asia",
  "associates",
  "at",
  "attorney",
  "au",
  "auction",
  "audio",
  "auto",
  "autos",
  "aw",
  "ax",
  "az",
  "ba",
  "baby",
  "band",
  "bank",
  "bar",
  "barcelona",
  "bargains",
  "basketball",
  "bayern",
  "bb",
  "be",
  "beauty",
  "beer",
  "berlin",
  "best",
  "bet",
  "bf",
  "bg",
  "bh",
  "bi",
  "bible",
  "bid",
  "bike",
  "bingo",
  "bio",
  "biz",
  "bj",
  "black",
  "blackfriday",
  "blog",
  "blue",
  "bm",
  "bo",
  "boats",
  "bond",
  "boo",
  "boston",
  "boutique",
  "broker",
  "brussels",
  "bs",
  "bt",
  "build",
  "builders",
  "business",
  "buzz",
  "bw",
  "by",
  "bz",
  "bzh",
  "ca",
  "cab",
  "cafe",
  "cam",
  "camera",
  "camp",
  "capetown",
  "capital",
  "car",
  "cards",
  "care",
  "career",
  "careers",
  "cars",
  "casa",
  "case",
  "cash",
  "casino",
  "cat",
  "catering",
  "cc",
  "cd",
  "center",
  "ceo",
  "cf",
  "cfd",
  "cg",
  "ch",
  "channel",
  "charity",
  "chat",
  "cheap",
  "christmas",
  "church",
  "ci",
  "city",
  "cl",
  "claims",
  "cleaning",
  "click",
  "clinic",
  "clothing",
  "cloud",
  "club",
  "cm",
  "cn",
  "co",
  "coach",
  "codes",
  "coffee",
  "college",
  "cologne",
  "com",
  "community",
  "company",
  "compare",
  "computer",
  "condos",
  "construction",
  "consulting",
  "contact",
  "contractors",
  "cooking",
  "cool",
  "coop",
  "corsica",
  "country",
  "coupons",
  "courses",
  "cr",
  "credit",
  "creditcard",
  "creditunion",
  "cricket",
  "cruises",
  "cu",
  "cv",
  "cw",
  "cx",
  "cy",
  "cymru",
  "cyou",
  "cz",
  "dad",
  "dance",
  "date",
  "dating",
  "day",
  "de",
  "dealer",
  "deals",
  "degree",
  "delivery",
  "democrat",
  "dental",
  "dentist",
  "desi",
  "design",
  "dev",
  "diamonds",
  "diet",
  "digital",
  "direct",
  "directory",
  "discount",
  "diy",
  "dj",
  "dk",
  "dm",
  "do",
  "doctor",
  "dog",
  "domains",
  "download",
  "durban",
  "dz",
  "earth",
  "ec",
  "eco",
  "education",
  "ee",
  "eg",
  "email",
  "energy",
  "engineer",
  "engineering",
  "enterprises",
  "equipment",
  "es",
  "esq",
  "estate",
  "et",
  "eu",
  "eus",
  "events",
  "exchange",
  "expert",
  "exposed",
  "express",
  "fail",
  "faith",
  "family",
  "fan",
  "fans",
  "farm",
  "fashion",
  "feedback",
  "fi",
  "film",
  "finance",
  "financial",
  "fish",
  "fishing",
  "fit",
  "fitness",
  "flights",
  "florist",
  "flowers",
  "fm",
  "fo",
  "foo",
  "food",
  "football",
  "forex",
  "forsale",
  "forum",
  "foundation",
  "fr",
  "frl",
  "fun",
  "fund",
  "furniture",
  "futbol",
  "fyi",
  "ga",
  "gal",
  "gallery",
  "game",
  "games",
  "garden",
  "gay",
  "gd",
  "gdn",
  "ge",
  "gent",
  "gf",
  "gg",
  "gi",
  "gift",
  "gifts",
  "gives",
  "giving",
  "gl",
  "glass",
  "global",
  "gm",
  "gmbh",
  "gold",
  "golf",
  "gp",
  "gq",
  "gr",
  "graphics",
  "gratis",
  "green",
  "gripe",
  "group",
  "gs",
  "gt",
  "gu",
  "guide",
  "guitars",
  "guru",
  "gw",
  "gy",
  "hair",
  "hamburg",
  "haus",
  "health",
  "healthcare",
  "help",
  "hiphop",
  "hiv",
  "hk",
  "hm",
  "hn",
  "hockey",
  "holdings",
  "holiday",
  "homes",
  "horse",
  "hospital",
  "host",
  "hosting",
  "house",
  "how",
  "hr",
  "ht",
  "hu",
  "icu",
  "id",
  "ie",
  "im",
  "immo",
  "immobilien",
  "in",
  "inc",
  "industries",
  "info",
  "ing",
  "ink",
  "institute",
  "insurance",
  "insure",
  "international",
  "investments",
  "io",
  "iq",
  "ir",
  "irish",
  "is",
  "ist",
  "istanbul",
  "it",
  "je",
  "jetzt",
  "jewelry",
  "jo",
  "jobs",
  "joburg",
  "jp",
  "juegos",
  "kaufen",
  "ke",
  "kg",
  "ki",
  "kids",
  "kim",
  "kitchen",
  "kiwi",
  "km",
  "kn",
  "koeln",
  "kr",
  "krd",
  "ky",
  "kyoto",
  "kz",
  "la",
  "land",
  "lat",
  "law",
  "lawyer",
  "lc",
  "lease",
  "legal",
  "lgbt",
  "li",
  "life",
  "lifestyle",
  "lighting",
  "limited",
  "limo",
  "link",
  "live",
  "living",
  "lk",
  "llc",
  "loan",
  "loans",
  "lol",
  "london",
  "lotto",
  "love",
  "ls",
  "lt",
  "ltd",
  "ltda",
  "lu",
  "luxe",
  "luxury",
  "lv",
  "ly",
  "ma",
  "madrid",
  "maison",
  "makeup",
  "management",
  "market",
  "marketing",
  "markets",
  "mba",
  "mc",
  "md",
  "me",
  "media",
  "melbourne",
  "meme",
  "memorial",
  "men",
  "menu",
  "mg",
  "miami",
  "mk",
  "ml",
  "mn",
  "mo",
  "mobi",
  "moda",
  "moe",
  "mom",
  "money",
  "monster",
  "mortgage",
  "moscow",
  "motorcycles",
  "mov",
  "movie",
  "mp",
  "mq",
  "mr",
  "ms",
  "mt",
  "mu",
  "museum",
  "music",
  "mw",
  "mx",
  "my",
  "na",
  "nagoya",
  "name",
  "navy",
  "nc",
  "ne",
  "net",
  "network",
  "new",
  "news",
  "nexus",
  "nf",
  "ng",
  "ngo",
  "ni",
  "ninja",
  "nl",
  "nlm",
  "no",
  "nowruz",
  "nr",
  "nrw",
  "nu",
  "nyc",
  "nz",
  "observer",
  "okinawa",
  "om",
  "one",
  "ong",
  "onl",
  "online",
  "ooo",
  "org",
  "organic",
  "osaka",
  "pa",
  "page",
  "paris",
  "partners",
  "parts",
  "party",
  "pe",
  "pet",
  "pf",
  "ph",
  "phd",
  "photo",
  "photography",
  "photos",
  "physio",
  "pics",
  "pictures",
  "pink",
  "pizza",
  "pk",
  "pl",
  "place",
  "plumbing",
  "plus",
  "pm",
  "pn",
  "poker",
  "porn",
  "pr",
  "press",
  "pro",
  "productions",
  "prof",
  "promo",
  "properties",
  "property",
  "protection",
  "ps",
  "pt",
  "pub",
  "pw",
  "qa",
  "qpon",
  "quebec",
  "quest",
  "racing",
  "radio",
  "re",
  "realestate",
  "realty",
  "recipes",
  "red",
  "rehab",
  "reise",
  "reisen",
  "reit",
  "ren",
  "rent",
  "rentals",
  "repair",
  "report",
  "republican",
  "rest",
  "restaurant",
  "review",
  "reviews",
  "rich",
  "rio",
  "rip",
  "ro",
  "rocks",
  "rodeo",
  "rs",
  "rsvp",
  "ru",
  "rugby",
  "ruhr",
  "run",
  "rw",
  "ryukyu",
  "sa",
  "saarland",
  "sale",
  "salon",
  "sarl",
  "sb",
  "sbs",
  "sc",
  "school",
  "schule",
  "science",
  "scot",
  "sd",
  "se",
  "security",
  "select",
  "services",
  "sex",
  "sexy",
  "sg",
  "sh",
  "shiksha",
  "shoes",
  "shop",
  "shopping",
  "show",
  "si",
  "singles",
  "site",
  "sk",
  "ski",
  "skin",
  "sl",
  "sm",
  "sn",
  "so",
  "soccer",
  "social",
  "software",
  "solar",
  "solutions",
  "soy",
  "spa",
  "space",
  "sport",
  "spreadbetting",
  "sr",
  "srl",
  "st",
  "storage",
  "store",
  "stream",
  "studio",
  "study",
  "style",
  "su",
  "sucks",
  "supplies",
  "supply",
  "support",
  "surf",
  "surgery",
  "sv",
  "swiss",
  "sx",
  "sydney",
  "systems",
  "taipei",
  "tatar",
  "tattoo",
  "tax",
  "taxi",
  "tc",
  "td",
  "team",
  "tech",
  "technology",
  "tel",
  "tennis",
  "tf",
  "tg",
  "theater",
  "theatre",
  "tickets",
  "tienda",
  "tips",
  "tires",
  "tirol",
  "tj",
  "tk",
  "tl",
  "tm",
  "tn",
  "to",
  "today",
  "tokyo",
  "tools",
  "top",
  "tours",
  "town",
  "toys",
  "trade",
  "trading",
  "training",
  "travel",
  "tt",
  "tube",
  "tv",
  "tw",
  "tz",
  "ua",
  "ug",
  "uk",
  "university",
  "uno",
  "us",
  "uy",
  "uz",
  "vacations",
  "vana",
  "vc",
  "vegas",
  "ventures",
  "versicherung",
  "vet",
  "vg",
  "vi",
  "viajes",
  "video",
  "villas",
  "vin",
  "vip",
  "vision",
  "vlaanderen",
  "vn",
  "vodka",
  "vote",
  "voting",
  "voto",
  "voyage",
  "vu",
  "vuelos",
  "wales",
  "wang",
  "watch",
  "watches",
  "webcam",
  "website",
  "wedding",
  "wf",
  "whoswho",
  "wien",
  "wiki",
  "win",
  "wine",
  "work",
  "works",
  "world",
  "ws",
  "wtf",
  "xyz",
  "yachts",
  "yoga",
  "yokohama",
  "yt",
  "zip",
  "zm",
  "zone",
  "zuerich",
] as const;

// Type definitions
export type TldExtension = typeof TLD_EXTENSIONS[number];

export interface TldCategory {
  name: string;
  extensions: string[];
  description?: string;
}

// Popular TLD extensions for quick access
export const POPULAR_TLDS: TldExtension[] = [
  "com", "net", "org", "info", "biz", "name", "pro", "io", "ai", "app",
  "dev", "tech", "online", "site", "store", "shop", "cloud", "digital",
  "me", "tv", "cc", "xyz", "co", "us", "uk", "ca", "au", "de"
];

// Business & Corporate TLDs
export const BUSINESS_TLDS: TldExtension[] = [
  "business", "company", "inc", "ltd", "llc", "gmbh", "sarl", "srl", "ltda",
  "enterprises", "holdings", "group", "team", "agency", "consulting", "management",
  "marketing", "services", "solutions", "systems", "ventures",
  "partners", "associates", "foundation", "ngo", "coop"
];

// Education & Learning TLDs
export const EDUCATION_TLDS: TldExtension[] = [
  "education", "academy", "school", "university", "college", "institute",
  "science", "study", "courses", "training", "phd", "mba", "degree",
  "schule", "shiksha", "ac", "education", "prof"
];

// International & Global TLDs
export const INTERNATIONAL_TLDS: TldExtension[] = [
  "international", "global", "world", "earth", "asia", "africa",
  "country", "city", "town", "place", "zone",
  "eu", "eus", "cymru", "wales", "scot", "irish", "swiss", "vlaanderen",
  "saarland", "bayern", "nrw", "ruhr", "tirol", "corsica", "alsace"
];

// Technology & Digital TLDs
export const TECHNOLOGY_TLDS: TldExtension[] = [
  "tech", "technology", "digital", "cloud", "ai", "software", "systems",
  "solutions", "network", "net", "online", "app", "dev", "codes",
  "computer", "software", "it", "ar", "ml", "ai"
];

// Social & Personal TLDs
export const SOCIAL_PERSONAL_TLDS: TldExtension[] = [
  "social", "community", "network", "chat", "forum", "blog", "live", "stream",
  "fan", "fans", "family", "dating", "singles", "love", "life",
  "lifestyle", "me", "name", "id",
];

// Professional & Services TLDs
export const PROFESSIONAL_SERVICES_TLDS: TldExtension[] = [
  "pro", "expert", "coach", "lawyer", "attorney", "legal", "law", "esq", "doctor", "health",
  "healthcare", "dental", "dentist", "physio", "clinic", "hospital",
  "vet", "accountant", "accountants", "financial", "finance", "bank",
  "insurance", "insure", "investments", "trading", "broker", "fund"
];

// Media & Entertainment TLDs
export const MEDIA_ENTERTAINMENT_TLDS: TldExtension[] = [
  "media", "news", "press", "radio", "tv", "video", "film", "movie",
  "music", "audio", "stream", "live", "show", "theater",
  "theatre", "fun", "games", "sport",
  "football", "soccer", "basketball", "tennis", "golf", "hockey", "cricket",
  "rugby", "racing", "fitness", "yoga", "dance", "art", "gallery",
  "photo", "photography", "pics", "pictures", "camera", "studio"
];

// E-commerce & Shopping TLDs
export const ECOMMERCE_SHOPPING_TLDS: TldExtension[] = [
  "shop", "shopping", "store", "market", "markets",
  "trade", "auction", "bid", "bargains",
  "deals", "discount", "cheap", "sale", "forsale", "coupons", "gift", "gifts"
];

// Industry & Sector Specific TLDs
export const INDUSTRY_SECTOR_TLDS: TldExtension[] = [
  "auto", "autos", "car", "cars", "motorcycles", "boats", "yachts",
  "airforce", "navy", "army", "security", "protection",
  "energy", "solar", "green", "eco",
  "construction", "build", "builders", "contractors", "plumbing", "repair",
  "realestate", "realty", "property", "properties", "estate", "land",
  "house", "apartments", "condos", "rent", "rentals", "lease", "mortgage"
];

// Lifestyle & Hobbies TLDs
export const LIFESTYLE_HOBBIES_TLDS: TldExtension[] = [
  "lifestyle", "life", "living",  "homes", "house", "family", "kids",
  "baby", "mom", "dad", "men",  "fashion", "beauty", "makeup", "hair",
  "clothing", "shoes", "jewelry", "watches", "luxury", "luxe", "rich", "vip",
  "food", "cooking", "recipes", "restaurant", "cafe", "coffee", "wine", "beer",
  "travel", "vacations", "tours", "cruises", "spa"
];

// Country code TLDs (ccTLDs) - filtered from actual list
export const COUNTRY_CODE_TLDS: TldExtension[] = [
  "us", "uk", "ca", "au", "de", "fr", "it", "es", "nl", "se", "no", "dk", "fi",
  "jp", "kr", "cn", "in", "br", "mx", "ar", "cl", "co", "pe", "ve", "ec",
  "ru", "pl", "cz", "hu", "ro", "bg", "hr", "si", "sk", "lt", "lv", "ee",
  "za", "ng", "ke", "eg", "ma", "tn", "dz", "ly", "sd", "et", "gh", "ci",
  "sn", "ml", "bf", "ne", "td", "cm", "cf", "cg", "cd", "ao", "zm", "zw",
  "bw", "na", "sz", "ls", "mg", "mu", "sc", "km", "re", "yt", "mz", "tz",
  "ug", "rw", "bi", "dj", "so", "er", "ss", "ad", "ae", "af", "ag", "ai",
  "al", "am", "ao", "aq", "ar", "as", "at", "au", "aw", "ax", "az", "ba",
  "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bl", "bm", "bn", "bo",
  "bq", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf",
  "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cw",
  "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg",
  "eh", "er", "es", "et", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb",
  "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr",
  "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id",
  "ie", "il", "im", "in", "io", "iq", "ir", "is", "it", "je", "jm", "jo",
  "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz",
  "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma",
  "mc", "md", "me", "mf", "mg", "mh", "mk", "ml", "mm", "mn", "mo", "mp",
  "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc",
  "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa",
  "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw",
  "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se",
  "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "ss", "st",
  "sv", "sx", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl",
  "tm", "tn", "to", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "um", "us",
  "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "ye",
  "yt", "za", "zm", "zw"
].filter(tld => TLD_EXTENSIONS.includes(tld as TldExtension)) as TldExtension[];

/**
 * Get all available TLD extensions
 */
export function getAllTldExtensions(): readonly TldExtension[] {
  return TLD_EXTENSIONS;
}

/**
 * Get popular TLD extensions
 */
export function getPopularTlds(): readonly TldExtension[] {
  return POPULAR_TLDS;
}

/**
 * Get business & corporate TLD extensions
 */
export function getBusinessTlds(): readonly TldExtension[] {
  return BUSINESS_TLDS;
}

/**
 * Get education & learning TLD extensions
 */
export function getEducationTlds(): readonly TldExtension[] {
  return EDUCATION_TLDS;
}

/**
 * Get international & global TLD extensions
 */
export function getInternationalTlds(): readonly TldExtension[] {
  return INTERNATIONAL_TLDS;
}

/**
 * Get technology & digital TLD extensions
 */
export function getTechnologyTlds(): readonly TldExtension[] {
  return TECHNOLOGY_TLDS;
}

/**
 * Get social & personal TLD extensions
 */
export function getSocialPersonalTlds(): readonly TldExtension[] {
  return SOCIAL_PERSONAL_TLDS;
}

/**
 * Get professional & services TLD extensions
 */
export function getProfessionalServicesTlds(): readonly TldExtension[] {
  return PROFESSIONAL_SERVICES_TLDS;
}

/**
 * Get media & entertainment TLD extensions
 */
export function getMediaEntertainmentTlds(): readonly TldExtension[] {
  return MEDIA_ENTERTAINMENT_TLDS;
}

/**
 * Get e-commerce & shopping TLD extensions
 */
export function getEcommerceShoppingTlds(): readonly TldExtension[] {
  return ECOMMERCE_SHOPPING_TLDS;
}

/**
 * Get industry & sector specific TLD extensions
 */
export function getIndustrySectorTlds(): readonly TldExtension[] {
  return INDUSTRY_SECTOR_TLDS;
}

/**
 * Get lifestyle & hobbies TLD extensions
 */
export function getLifestyleHobbiesTlds(): readonly TldExtension[] {
  return LIFESTYLE_HOBBIES_TLDS;
}

/**
 * Get country code TLD extensions
 */
export function getCountryCodeTlds(): readonly TldExtension[] {
  return COUNTRY_CODE_TLDS;
}

/**
 * Search TLD extensions by query
 */
export function searchTldExtensions(query: string): TldExtension[] {
  const lowercaseQuery = query.toLowerCase();
  return TLD_EXTENSIONS.filter(extension =>
    extension.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get TLD extensions by category
 */
export function getTldExtensionsByCategory(): TldCategory[] {
  return [
    {
      name: "Popular",
      extensions: POPULAR_TLDS,
      description: "Most commonly used TLD extensions"
    },
    {
      name: "Business",
      extensions: BUSINESS_TLDS,
      description: "Business and corporate domain extensions"
    },
    {
      name: "Education",
      extensions: EDUCATION_TLDS,
      description: "Education and learning domain extensions"
    },
    {
      name: "International",
      extensions: INTERNATIONAL_TLDS,
      description: "International and global domain extensions"
    },
    {
      name: "Technology",
      extensions: TECHNOLOGY_TLDS,
      description: "Technology and digital domain extensions"
    },
    {
      name: "Social & Personal",
      extensions: SOCIAL_PERSONAL_TLDS,
      description: "Social media and personal domain extensions"
    },
    {
      name: "Professional & Services",
      extensions: PROFESSIONAL_SERVICES_TLDS,
      description: "Professional services and expertise domain extensions"
    },
    {
      name: "Media & Entertainment",
      extensions: MEDIA_ENTERTAINMENT_TLDS,
      description: "Media, entertainment, and sports domain extensions"
    },
    {
      name: "E-commerce & Shopping",
      extensions: ECOMMERCE_SHOPPING_TLDS,
      description: "E-commerce and shopping domain extensions"
    },
    {
      name: "Industry & Sector",
      extensions: INDUSTRY_SECTOR_TLDS,
      description: "Industry-specific and sector domain extensions"
    },
    {
      name: "Lifestyle & Hobbies",
      extensions: LIFESTYLE_HOBBIES_TLDS,
      description: "Lifestyle, hobbies, and personal interest domain extensions"
    },
    {
      name: "Country Codes",
      extensions: COUNTRY_CODE_TLDS,
      description: "Country-specific domain extensions"
    }
  ];
}

/**
 * Check if a TLD extension is valid
 */
export function isValidTldExtension(extension: string): extension is TldExtension {
  return TLD_EXTENSIONS.includes(extension as TldExtension);
}

/**
 * Format TLD extension with dot prefix
 */
export function formatTldWithDot(extension: string): string {
  return extension.startsWith('.') ? extension : `.${extension}`;
}

/**
 * Remove dot prefix from TLD extension
 */
export function removeDotPrefix(extension: string): string {
  return extension.startsWith('.') ? extension.substring(1) : extension;
}

/**
 * Get total count of available TLD extensions
 */
export function getTldCount(): number {
  return TLD_EXTENSIONS.length;
}

/**
 * Get random TLD extensions (useful for testing or suggestions)
 */
export function getRandomTlds(count: number = 5): TldExtension[] {
  const shuffled = [...TLD_EXTENSIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Export the main array for direct access if needed
export { TLD_EXTENSIONS };
