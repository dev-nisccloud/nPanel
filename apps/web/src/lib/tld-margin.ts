/** Client-side TLD margin resolve helpers (mirrors packages/api/src/lib/tld-margin.ts). */

export type ClientMarginConfig = {
  id?: string;
  name?: string;
  marginType: string | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
  isDefault?: boolean;
};

export type ClientMarginMap = {
  default: ClientMarginConfig | null;
  overrides: Record<string, ClientMarginConfig>;
};

export function normalizeTldExtension(input: string): string {
  return input.trim().toLowerCase().replace(/^\.+/, "");
}

/** `example.co.ke` → `co.ke` */
export function extractExtensionFromDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase();
  const idx = normalized.indexOf(".");
  if (idx < 0) return normalizeTldExtension(normalized);
  return normalized.slice(idx + 1);
}

export function resolveMarginForDomain(
  map: ClientMarginMap | null | undefined,
  domain: string,
): ClientMarginConfig | null {
  if (!map) return null;
  const key = extractExtensionFromDomain(domain);
  if (key && map.overrides[key]) return map.overrides[key];
  return map.default;
}

export function applyMarginToPrice(
  originalPrice: number,
  setting: ClientMarginConfig | null,
): {
  marginAmount: number;
  finalPrice: number;
  marginType: string | null;
  marginValue: string | null;
} {
  if (!setting) {
    return {
      marginAmount: 0,
      finalPrice: originalPrice,
      marginType: null,
      marginValue: null,
    };
  }

  const { marginType, percentageMargin, fixedMargin, roundOff } = setting;
  let marginAmount = 0;
  let finalPrice = originalPrice;

  if (marginType === "PERCENTAGE" && percentageMargin) {
    const percentage = parseFloat(percentageMargin);
    if (!Number.isNaN(percentage)) {
      marginAmount = (originalPrice * percentage) / 100;
      finalPrice = originalPrice + marginAmount;
    }
  } else if (marginType === "FIXED" && fixedMargin) {
    const fixed = parseFloat(fixedMargin);
    if (!Number.isNaN(fixed)) {
      marginAmount = fixed;
      finalPrice = originalPrice + marginAmount;
    }
  }

  if (roundOff) {
    const roundOffValue = parseFloat(roundOff);
    if (!Number.isNaN(roundOffValue) && roundOffValue > 0) {
      finalPrice = Math.ceil(finalPrice / roundOffValue) * roundOffValue;
      marginAmount = finalPrice - originalPrice;
    }
  }

  return {
    marginAmount,
    finalPrice,
    marginType,
    marginValue: marginType === "PERCENTAGE" ? percentageMargin : fixedMargin,
  };
}

export function getMarginMapHash(map: ClientMarginMap | null | undefined): string {
  if (!map) return "no-map";
  const def = map.default;
  const defaultPart = def
    ? `${def.id}-${def.marginType}-${def.percentageMargin}-${def.fixedMargin}-${def.roundOff}`
    : "no-default";
  const overrideKeys = Object.keys(map.overrides).sort();
  const overridePart = overrideKeys
    .map((k) => {
      const o = map.overrides[k]!;
      return `${k}:${o.id}-${o.marginType}-${o.percentageMargin}-${o.fixedMargin}-${o.roundOff}`;
    })
    .join("|");
  return `${defaultPart}::${overridePart}`;
}
