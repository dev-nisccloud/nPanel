import {
  Cpu,
  Database,
  Globe,
  HardDrive,
  Mail,
  MemoryStick,
  Network,
  Server,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProductFeatureRow, SharedHostingPlan } from "@/lib/vps-plans-api.ts";
import { planAudience, publicPlanName } from "@/lib/plan-catalog.ts";

export function deriveMonthlyPrice(niscPrice: string | null | undefined, billingCycle: string) {
  if (!niscPrice) return 0;
  const price = parseFloat(niscPrice);
  if (isNaN(price)) return 0;

  if (billingCycle === "YEARLY") return Math.round(price / 12);
  if (billingCycle === "BIENNIALLY") return Math.round(price / 24);
  if (billingCycle === "TRIENNIALLY") return Math.round(price / 36);
  return Math.round(price);
}

export function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFeatureIcon(key: string, label: string): LucideIcon {
  const value = `${key} ${label}`.toLowerCase();
  if (value.includes("cpu") || value.includes("core")) return Cpu;
  if (value.includes("ram") || value.includes("memory")) return MemoryStick;
  if (value.includes("website") || value.includes("domain") || value.includes("site")) return Globe;
  if (value.includes("storage") || value.includes("disk") || value.includes("nvme")) return HardDrive;
  if (value.includes("bandwidth") || value.includes("traffic")) return Network;
  if (value.includes("email") || value.includes("mailbox")) return Mail;
  if (value.includes("ssl") || value.includes("security") || value.includes("malware") || value.includes("ddos")) return ShieldCheck;
  if (value.includes("backup") || value.includes("database")) return Database;
  if (value.includes("panel") || value.includes("ftp") || value.includes("ssh")) return Server;
  return Zap;
}

/** "Unlimited" allowances are covered by the fair-use clause in Terms §11. */
export const FAIR_USE_HREF = "/terms#acceptable-use";

export type PlanFeature = {
  key: string;
  label: string;
  description?: string;
  /** `null` when the feature is not part of this plan. */
  value: string | null;
  /** True when the catalogue value is a bare inclusion rather than a quantity. */
  boolean: boolean;
  fairUse: boolean;
  /** 0–1 share of the largest allowance across the plans shown; set on headline specs only. */
  meter?: number;
};

/** Shared hosting storage is NVMe (owner decision, 7 Nov 2026); the catalogue still says "SSD". */
export function normaliseProductDescription(text: string | null): string | null {
  return text
    ? text
        .replace(/(?<!NVMe )\bSSD hosting\b/g, "NVMe SSD hosting")
        .replace(/\bWordPress toolkit\b/g, "WordPress Toolkit")
        // Support hours are unconfirmed, so catalogue support claims are not shown.
        .replace(/,?\s*(?:and\s+)?24\/7(?:\/365)?\s+(?:local|ticket)?\s*support/gi, "")
        .replace(/,\s*\./g, ".")
    : text;
}

/**
 * The nPanel catalogue labels uptime as a "99.9% uptime guarantee" and shared storage as "SSD".
 * Public copy states a 99.9% uptime target (never a guarantee) and NVMe SSD storage, so both are
 * normalised here until the catalogue is updated.
 */
export function normalisePlanFeature(
  feature: ProductFeatureRow,
  raw: { available: boolean; valueOverride: string | null } | undefined,
): PlanFeature {
  const isUptime = /uptime/i.test(feature.key) || /uptime/i.test(feature.label);
  const isSupport = /support/i.test(feature.label) && /24\s*\/\s*7/.test(feature.label);
  const label = isUptime
    ? "Uptime target"
    : isSupport
      ? "Support through nPanel"
      : feature.key === "ssd_storage" || /^ssd storage$/i.test(feature.label)
        ? "NVMe SSD storage"
        : feature.label;
  const base = {
    key: feature.key,
    label,
    description: isSupport ? "Raise support requests from your nPanel account." : feature.description,
  };
  if (!raw?.available) return { ...base, value: null, boolean: true, fairUse: false };
  if (isSupport) return { ...base, value: "Included", boolean: true, fairUse: false };

  const override = raw.valueOverride?.trim() || null;
  if (isUptime) {
    return {
      ...base,
      description: "Our infrastructure is run to a 99.9% monthly uptime target. Service credits are set out in our Terms of Service.",
      value: "99.9%",
      boolean: false,
      fairUse: false,
    };
  }
  if (override && /^unlimited$/i.test(override)) {
    if (/ssl/i.test(feature.key)) return { ...base, value: "Included", boolean: true, fairUse: false };
    return { ...base, value: "Unlimited", boolean: false, fairUse: true };
  }
  return { ...base, value: override ?? "Included", boolean: !override, fairUse: false };
}

export type PlanModel = {
  plan: SharedHostingPlan;
  /** Public name; `plan.name` stays the catalogue name used for checkout. */
  displayName: string;
  audience: string | null;
  monthlyPrice: number;
  features: PlanFeature[];
  /** The four quantities buyers compare first (storage, memory, CPU, sites or bandwidth). */
  headline: PlanFeature[];
  /** Every included feature that is not already a headline spec. */
  specs: PlanFeature[];
  featured: boolean;
};

/** Size in a common unit so "1 TB" outranks "500 GB"; `null` when the value is not a quantity. */
function magnitude(value: string): number | null {
  const m = value.replace(/,/g, "").match(/^(\d+(?:\.\d+)?)\s*([a-z]*)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === "tb") return n * 1024;
  if (unit === "mb") return n / 1024;
  return n;
}

const HEADLINE_KEYS = ["wordpress_sites", "nvme_storage", "ssd_storage", "storage", "ram", "cpu", "bandwidth"];

/** The same headline keys for every plan of a product, so the tiles line up across cards. */
function pickHeadlineKeys(rows: PlanFeature[][]): string[] {
  const keys = rows[0]?.map((f) => f.key) ?? [];
  const quantified = keys.filter(
    (key, i) =>
      !/uptime/i.test(key) &&
      rows.some((features) => {
        const f = features[i];
        return f.value && !f.boolean && (f.fairUse || magnitude(f.value) != null);
      }),
  );
  const ordered = HEADLINE_KEYS.filter((k) => quantified.includes(k));
  return [...ordered, ...quantified.filter((k) => !ordered.includes(k))].slice(0, 4);
}

export function buildPlanModels(plans: SharedHostingPlan[], productFeatures: ProductFeatureRow[]): PlanModel[] {
  const featuredId =
    plans.find((p) => p.isRecommended)?.id ?? plans.find((p) => p.isPopular)?.id ?? plans[Math.floor(plans.length / 2)]?.id;

  const rows = plans.map((plan) => productFeatures.map((f, i) => normalisePlanFeature(f, plan.featureValues?.[i])));

  const maxByKey = new Map<string, number>();
  for (const features of rows) {
    for (const f of features) {
      const size = f.value && !f.fairUse ? magnitude(f.value) : null;
      if (size != null) maxByKey.set(f.key, Math.max(maxByKey.get(f.key) ?? 0, size));
    }
  }

  const headlineOrder = pickHeadlineKeys(rows);
  const headlineKeys = new Set(headlineOrder);

  return plans.map((plan, p) => {
    const features = rows[p];
    const headline = headlineOrder
      .map((key) => features.find((f) => f.key === key)!)
      .map((f) => {
        if (!f.value) return { ...f, meter: 0 };
        if (f.fairUse) return { ...f, meter: 1 };
        const size = magnitude(f.value);
        const max = maxByKey.get(f.key);
        return size != null && max ? { ...f, meter: Math.max(0.08, size / max) } : f;
      });
    return {
      plan,
      displayName: publicPlanName(plan.id, plan.name),
      audience: planAudience(plan.id),
      monthlyPrice: deriveMonthlyPrice(plan.niscPrice, plan.billingCycle),
      features,
      headline,
      specs: features.filter((f) => f.value && !headlineKeys.has(f.key)),
      featured: plan.id === featuredId,
    };
  });
}

/** "Email accounts" -> "email accounts" for inline use, keeping acronyms such as "FTP" or "PHP". */
export function inlineLabel(label: string): string {
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

/** Compact label for the spec tiles, where the full catalogue label does not fit. */
export function tileLabel(feature: PlanFeature): string {
  const text = `${feature.key} ${feature.label}`.toLowerCase();
  if (text.includes("storage")) return text.includes("nvme") || text.includes("ssd") ? "NVMe storage" : "Storage";
  if (text.includes("bandwidth")) return "Bandwidth";
  if (text.includes("mailbox") || text.includes("mail box")) return "Mailboxes";
  if (text.includes("wordpress_sites") || text.includes("wordpress sites")) return "WP sites";
  return feature.label;
}
