import { z } from "zod";

// --- Types ---
export const vpsPlanSchema = z.object({
  product_id: z.number().int(),
  product_name: z.union([z.string(), z.null()]).transform((v) =>
    typeof v === "string" && v.trim().length > 0 ? v : "Custom VPS plan"
  ),
  data_center: z.string(),
  location_option_id: z.number().int(),
  stock: z.enum(["available", "limited", "unavailable"]),
  is_vps: z.boolean(),
  is_vds: z.boolean(),
  product_cpu_cores: z.string().optional(),
  product_cpu: z.string().optional(),
  processor_info: z.unknown().optional(),
  product_memory: z.string().optional(),
  product_drive: z.string().optional(),
  product_drive_info: z.unknown().optional(),
  product_bandwidth: z.string().optional(),
  product_hourly_price: z.number().optional(),
  product_monthly_price: z.number().optional(),
  product_on_sale: z.boolean().optional(),
  product_original_price: z.number().optional(),
  product_new: z.boolean().optional(),
});

export type VpsPlan = z.infer<typeof vpsPlanSchema>;

export function inventoryToVpsPlans(inventory: unknown): VpsPlan[] {
  if (!inventory) return [];

  let all: unknown[] = [];
  if (Array.isArray(inventory)) {
    all = inventory;
  } else if (typeof inventory === "object") {
    for (const value of Object.values(inventory as Record<string, unknown>)) {
      if (Array.isArray(value)) all.push(...value);
    }
  }

  return all
    .map((item) => vpsPlanSchema.safeParse(item))
    .filter((r): r is { success: true; data: VpsPlan } => r.success)
    .map((r) => r.data);
}

export type MarginType = "PERCENTAGE" | "FIXED";

export type PricingMargin = {
  marginType: MarginType | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
};

export type PricingSettings = {
  base: PricingMargin;
  os: PricingMargin;
  addons: PricingMargin;
};

// --- API ---
const TRPC_BASE = "/api/trpc";

type TrpcBatchItem = {
  result?: { data?: unknown };
  error?: { message?: string };
};

function batchEnvelope(input: unknown): Record<string, unknown> {
  return { "0": input };
}

async function parseTrpcBatch(res: Response): Promise<unknown> {
  const batch = (await res.json()) as TrpcBatchItem[];
  if (batch[0]?.error) throw new Error(batch[0].error.message ?? "tRPC error");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return batch[0]?.result?.data;
}

export async function trpcQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const params = new URLSearchParams({ batch: "1" });
  if (input !== undefined) {
    params.set("input", JSON.stringify(batchEnvelope(input)));
  }
  const res = await fetch(`${TRPC_BASE}/${procedure}?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  return parseTrpcBatch(res) as T;
}

// --- Shared hosting plans ---

export type SharedHostingPlan = {
  id: string;
  name: string;
  niscPrice: string | null;
  niscCurrency: string;
  billingCycle: string;
  isPopular: boolean;
  isRecommended: boolean;
  productId: string;
  productName: string;
  featureValues: Array<{ available: boolean; valueOverride: string | null }>;
};

export type ProductFeatureRow = {
  key: string;
  label: string;
  description?: string;
};

export type SharedHostingPricingData = {
  plans: SharedHostingPlan[];
  productFeatures: ProductFeatureRow[];
};

export async function fetchSharedHostingPlansPublic(): Promise<SharedHostingPricingData> {
  const res = await trpcQuery<{ success?: boolean; plans?: SharedHostingPlan[]; productFeatures?: ProductFeatureRow[] }>(
    "products.getHostingPlansForPricing"
  );
  return {
    plans: res?.plans ?? [],
    productFeatures: res?.productFeatures ?? [],
  };
}

export async function fetchEmailHostingPlansPublic(): Promise<SharedHostingPricingData> {
  const res = await trpcQuery<{ success?: boolean; plans?: SharedHostingPlan[]; productFeatures?: ProductFeatureRow[] }>(
    "products.getEmailHostingPlansForPricing"
  );
  return {
    plans: res?.plans ?? [],
    productFeatures: res?.productFeatures ?? [],
  };
}

export async function fetchWordPressHostingPlansPublic(): Promise<SharedHostingPricingData> {
  const res = await trpcQuery<{ success?: boolean; plans?: SharedHostingPlan[]; productFeatures?: ProductFeatureRow[] }>(
    "products.getWordPressPlansForPricing"
  );
  return {
    plans: res?.plans ?? [],
    productFeatures: res?.productFeatures ?? [],
  };
}

// --- Specific fetchers ---

export async function fetchVpsPlansPublic(cursor: number = 0, limit: number = 24) {
  const res = await trpcQuery<{ success: boolean; data: any }>("hivelocity.publicGetVpsPlans", {
    limit,
    cursor,
    location: "MAIN", // Standard filter
  });

  if (!res.success) throw new Error("Failed to fetch VPS plans");

  const items = res.data?.items ?? [];
  return {
    plans: inventoryToVpsPlans({ FLAT: items }),
    nextCursor: res.data?.nextCursor,
  };
}

export async function fetchVdsPlansPublic(cursor: number = 0, limit: number = 24) {
  const res = await trpcQuery<{ success: boolean; data: any }>("hivelocity.publicGetVdsPlans", {
    limit,
    cursor,
    location: "MAIN",
  });

  if (!res.success) throw new Error("Failed to fetch VDS plans");

  const items = res.data?.items ?? [];
  return {
    plans: inventoryToVpsPlans({ FLAT: items }), // Can reuse VpsPlan schema/type
    nextCursor: res.data?.nextCursor,
  };
}

export async function fetchDedicatedPlansPublic(cursor: number = 0, limit: number = 24) {
  const res = await trpcQuery<{ success: boolean; data: any }>("hivelocity.publicGetDedicatedServerPlans", {
    limit,
    cursor,
    location: "MAIN",
  });

  if (!res.success) throw new Error("Failed to fetch dedicated plans");

  const items = res.data?.items ?? [];
  return {
    plans: inventoryToVpsPlans({ FLAT: items }), // Reusing schema since fields are identical
    nextCursor: res.data?.nextCursor,
  };
}

export type Facility = {
  code: string;
  title: string;
  // other fields omitted
};

export async function fetchFacilitiesPublic(): Promise<Facility[]> {
  try {
    const res = await trpcQuery<{ success: boolean; data: Facility[] }>("hivelocity.publicGetFacilities");
    if (!res.success) return [];
    return res.data || [];
  } catch (e) {
    console.error("Failed to fetch facilities:", e);
    return [];
  }
}

export async function fetchVpsPricingSettings(): Promise<PricingSettings | null> {
  const res = await trpcQuery<{ success: boolean; data: any }>("hivelocityPricingSettings.get", {
    productType: "VPS",
  });
  if (!res.success || !res.data) return null;
  const raw = res.data;
  return {
    base: {
      marginType: raw.marginType ?? null,
      percentageMargin: raw.percentageMargin ?? null,
      fixedMargin: raw.fixedMargin ?? null,
      roundOff: raw.roundOff ?? null,
    },
    os: {
      marginType: raw.osMarginType ?? null,
      percentageMargin: raw.osPercentageMargin ?? null,
      fixedMargin: raw.osFixedMargin ?? null,
      roundOff: raw.osRoundOff ?? null,
    },
    addons: {
      marginType: raw.addonsMarginType ?? null,
      percentageMargin: raw.addonsPercentageMargin ?? null,
      fixedMargin: raw.addonsFixedMargin ?? null,
      roundOff: raw.addonsRoundOff ?? null,
    },
  };
}

export async function fetchExchangeRatesPublic(): Promise<number | null> {
  const res = await trpcQuery<{ success: boolean; data: any }>("publicPricing.getExchangeRatesPublic", {
    baseCurrency: "USD",
  });
  if (!res.success || !res.data) return null;
  const rates = res.data.rates as Record<string, number>;
  const kes = rates.KES;
  return typeof kes === "number" && Number.isFinite(kes) ? kes : null;
}

// --- Math ---
export function applyMarginWith(margin: PricingMargin | null, priceUsd: number) {
  if (!margin || !Number.isFinite(priceUsd)) return { original: priceUsd, final: priceUsd, marginAmount: 0 };

  let marginAmount = 0;
  let final = priceUsd;

  if (margin.marginType === "PERCENTAGE" && margin.percentageMargin) {
    const p = Number.parseFloat(margin.percentageMargin);
    if (Number.isFinite(p)) {
      marginAmount = (priceUsd * p) / 100;
      final = priceUsd + marginAmount;
    }
  } else if (margin.marginType === "FIXED" && margin.fixedMargin) {
    const f = Number.parseFloat(margin.fixedMargin);
    if (Number.isFinite(f)) {
      marginAmount = f;
      final = priceUsd + marginAmount;
    }
  }

  if (margin.roundOff) {
    const ro = Number.parseFloat(margin.roundOff);
    if (Number.isFinite(ro) && ro > 0) {
      final = Math.ceil(final / ro) * ro;
      marginAmount = final - priceUsd;
    }
  }

  return { original: priceUsd, final, marginAmount };
}
