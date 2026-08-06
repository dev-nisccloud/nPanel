"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, RefreshCw, AlertCircle, Layers, FileText, Crosshair, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog";
import { DownloadLinkedInAdsReportButton } from "./agency.ad-campaigns/linkedin-ads/_components/report/download-button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return " ";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: num % 1 === 0 ? 0 : 2 });
}

function formatCompactNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return " ";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return "0";
  try {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
  } catch {
    return formatNumber(num);
  }
}

function buildSmartTicks(maxValue: number): number[] | undefined {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return undefined;
  if (maxValue <= 5_000) {
    return Array.from({ length: 11 }, (_, i) => i * 500); // 0..5000 step 500
  }
  // After 5k, prefer 5k increments (5k/10k/15k/...)
  const preferredStep = 5_000;
  const preferredTop = Math.ceil(maxValue / preferredStep) * preferredStep;
  const preferredCount = preferredTop / preferredStep + 1;
  if (preferredCount <= 12) {
    return Array.from({ length: preferredCount }, (_, i) => i * preferredStep);
  }

  // If values are very large, keep tick count reasonable by widening the step.
  const fallbackSteps = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];
  for (const step of fallbackSteps) {
    const top = Math.ceil(maxValue / step) * step;
    const count = top / step + 1;
    if (count <= 12) return Array.from({ length: count }, (_, i) => i * step);
  }

  const step = 2_000_000;
  const top = Math.ceil(maxValue / step) * step;
  return Array.from({ length: Math.min(12, top / step + 1) }, (_, i) => i * step);
}

function getSmartYAxisDomainMax(maxValue: number): number | "auto" {
  const ticks = buildSmartTicks(maxValue);
  const last = ticks?.[ticks.length - 1];
  return typeof last === "number" && Number.isFinite(last) && last > 0 ? last : "auto";
}

function wrapXAxisLabel(input: string, opts?: { maxCharsPerLine?: number; maxLines?: number }): string[] {
  const maxCharsPerLine = Math.max(6, Math.floor(opts?.maxCharsPerLine ?? 18));
  const maxLines = Math.max(1, Math.floor(opts?.maxLines ?? 3));

  const s = String(input ?? "").trim();
  if (!s) return [" "];

  // Prefer word-wrapping; fall back to hard-splitting long tokens.
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current.trim()) lines.push(current.trim());
    current = "";
  };

  for (const w of words) {
    // If the word itself is too long, split it.
    if (w.length > maxCharsPerLine) {
      if (current) pushCurrent();
      for (let i = 0; i < w.length; i += maxCharsPerLine) {
        lines.push(w.slice(i, i + maxCharsPerLine));
        if (lines.length >= maxLines) break;
      }
      if (lines.length >= maxLines) break;
      continue;
    }

    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      pushCurrent();
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  pushCurrent();

  // Clamp and add ellipsis if we had to truncate.
  const combined = lines.join(" ").replace(/\s+/g, " ").trim();
  const wasTruncated = combined.length < s.replace(/\s+/g, " ").trim().length || lines.length > maxLines;
  const clamped = lines.slice(0, maxLines);
  if (wasTruncated && clamped.length > 0) {
    const i = clamped.length - 1;
    const base = clamped[i].replace(/…$/g, "").trim();
    clamped[i] = base.length >= maxCharsPerLine ? `${base.slice(0, Math.max(0, maxCharsPerLine - 1))}…` : `${base}…`;
  }
  return clamped.length > 0 ? clamped : [" "];
}

function MultiLineXAxisTick(props: any) {
  const { x, y, payload } = props;
  const value = String(payload?.value ?? "");
  const lines = wrapXAxisLabel(value, { maxCharsPerLine: 18, maxLines: 3 });

  // Recharts positions ticks at the baseline; shift down a bit and use tspans.
  return (
    <text x={x} y={y} textAnchor="middle" fill="currentColor" fontSize={9}>
      {lines.map((line, idx) => (
        <tspan key={idx} x={x} dy={idx === 0 ? 10 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function VerticalXAxisTick(props: any) {
  const { x, y, payload } = props;
  const value = String(payload?.value ?? "");
  // Rotate around the tick point so the label runs vertically downward.
  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fill="currentColor"
      fontSize={9}
      transform={`rotate(-90, ${x}, ${y})`}
    >
      {value}
    </text>
  );
}

function calcVerticalTickHeight(labels: Array<string | null | undefined>, fontSize = 9): number {
  const longest = Math.max(0, ...labels.map((s) => String(s ?? "").length));
  // Rough width estimate per character at this font size.
  const charPx = Math.max(5, Math.round(fontSize * 0.62));
  const needed = longest * charPx + 18; // + padding so descenders don't clip
  return Math.min(260, Math.max(70, needed));
}

function truncateLabel(label: string, max = 16): string {
  const s = String(label || "");
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

function formatCurrency(value: number | string | null | undefined, currency: string): string {
  if (value === null || value === undefined || value === "") return " ";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return "0";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${formatNumber(num)}`;
  }
}

function statusStyles(status?: string | null): { variant: "outline" | "secondary" | "destructive"; className?: string } {
  const value = (status || "").toUpperCase();
  if (value === "ACTIVE") {
    return {
      variant: "outline",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 rounded-full",
    };
  }
  if (value === "PAUSED" || value === "DRAFT") {
    return {
      variant: "secondary",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800 rounded-full",
    };
  }
  if (value === "REMOVED" || value === "ARCHIVED" || value === "CANCELED") {
    return { variant: "destructive", className: "rounded-full" };
  }
  return { variant: "secondary", className: "rounded-full" };
}

function humanizeLabel(value?: string | null): string {
  if (!value) return "N/A";
  return value.replace(/_/g, " ");
}

function toTopNBreakdownRows(
  rows: any[] | null | undefined,
  key: "impressions" | "clicks" | "spend" | "conversions" | "leads" = "impressions",
  n = 10
): Array<{ name: string; value: number }> {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return [...rows]
    .map((r) => ({ name: String(r?.pivot ?? "Unknown"), value: Number(r?.[key] ?? 0) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

function toTopNBreakdownRowsMulti(rows: any[] | null | undefined, n = 10): Array<{
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  videoViews: number;
}> {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return [...rows]
    .map((r) => ({
      name: String(r?.pivot ?? "Unknown"),
      impressions: Number(r?.impressions ?? 0),
      clicks: Number(r?.clicks ?? 0),
      spend: Number(r?.spend ?? 0),
      leads: Number(r?.leads ?? 0),
      videoViews: Number(r?.videoViews ?? 0),
    }))
    .filter((r) => r.impressions > 0 || r.clicks > 0 || r.spend > 0 || r.leads > 0 || r.videoViews > 0)
    .sort((a, b) => (b.impressions + b.clicks) - (a.impressions + a.clicks))
    .slice(0, n);
}

function toSafeCssKey(input: string): string {
  const base = (input || "unknown")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "unknown";
}

function buildCategoryChartConfig(
  rows: Array<{ name: string; value: number }>,
  paletteSize = 5
): { config: ChartConfig; nameToKey: Record<string, string> } {
  const cfg: Record<string, { label: string; color: string }> = {};
  const nameToKey: Record<string, string> = {};

  rows.forEach((r, idx) => {
    const label = String(r.name || "Unknown");
    let key = toSafeCssKey(label);
    // ensure unique keys
    if (cfg[key]) key = `${key}_${idx}`;
    nameToKey[label] = key;
    cfg[key] = { label, color: `var(--chart-${(idx % paletteSize) + 1})` };
  });

  cfg.unknown = cfg.unknown || { label: "Unknown", color: "var(--chart-5)" };
  return { config: cfg satisfies ChartConfig, nameToKey };
}

/**
 * Facets whose values can be decoded directly from the URN string   no lookup needed.
 *
 * Everything else (industries, seniorities, titles, skills, degrees, fields of study,
 * functions, geos) will show as a raw ID until the static maps are filled in from the
 * linkedInAds.standardizedData.* Postman endpoints.
 */

const LINKEDIN_FACET_LABELS: Record<string, string> = {
  industries: "Industries", seniorities: "Seniorities", titles: "Job Titles",
  locations: "Locations", profileLocations: "Profile Locations",
  interfaceLocales: "Languages", jobFunctions: "Job Functions",
  functions: "Job Functions",
  employers: "Employers", employersAll: "Employers (All)", employersPast: "Past Employers",
  skills: "Skills", groups: "LinkedIn Groups",
  degrees: "Degrees", fieldsOfStudy: "Fields of Study", schools: "Schools",
  ageRanges: "Age Ranges", genders: "Genders",
  yearsOfExperienceRanges: "Years of Experience",
  staffCountRanges: "Company Size",
  companyIndustry: "Company Industries",
  memberInterests: "Interests", memberTraits: "Member Traits",
  memberBehaviors: "Member Behaviors",
  growthRate: "Company Growth Rate",
  followedCompanies: "Followed Companies",
  firstDegreeConnectionCompanies: "1st-Degree Connection Companies",
  buyerGroups: "Buyer Groups",
};

/** Parse urn:li:locale:en_US → "English (US)" */
function resolveLocale(id: string): string {
  const parts = id.split("_");
  if (parts.length !== 2) return id;
  const langMap: Record<string, string> = {
    en: "English", es: "Spanish", fr: "French", de: "German",
    pt: "Portuguese", it: "Italian", zh: "Chinese", ja: "Japanese",
    ko: "Korean", ar: "Arabic", ru: "Russian", nl: "Dutch",
    sv: "Swedish", da: "Danish", fi: "Finnish", nb: "Norwegian",
    pl: "Polish", tr: "Turkish", id: "Indonesian", ms: "Malay",
  };
  const lang = langMap[parts[0].toLowerCase()] || parts[0].toUpperCase();
  return `${lang} (${parts[1]})`;
}

/** Parse urn:li:gender:FEMALE → "Female" */
function resolveGender(id: string): string {
  const map: Record<string, string> = { MALE: "Male", FEMALE: "Female" };
  return map[id.toUpperCase()] ?? id;
}

/** Parse urn:li:ageRange:(18,24) → "18–24 yrs"  /  (55,2147483647) → "55+ yrs" */
function resolveAgeRange(id: string): string {
  const m = id.match(/^\((\d+),(\d+)\)$/);
  if (!m) return id;
  const upper = parseInt(m[2], 10);
  return upper >= 2_000_000_000 ? `${m[1]}+ yrs` : `${m[1]}–${m[2]} yrs`;
}

/** Parse urn:li:staffCountRange:(2,10) → "2–10 employees"  /  (10001,…) → "10,001+ employees" */
function resolveStaffCount(id: string): string {
  const m = id.match(/^\((\d+),(\d+)\)$/);
  if (!m) return id;
  const lo = parseInt(m[1], 10);
  const hi = parseInt(m[2], 10);
  if (lo === hi) return `${lo.toLocaleString()} employee${lo === 1 ? "" : "s"}`;
  if (hi >= 2_000_000_000) return `${lo.toLocaleString()}+ employees`;
  return `${lo.toLocaleString()}–${hi.toLocaleString()} employees`;
}

/** Parse urn:li:growthRate:(-2147483647,0) → "Declining (<0%)"  etc. */
function resolveGrowthRate(id: string): string {
  const m = id.match(/^\((-?\d+),(-?\d+)\)$/);
  if (!m) return id;
  const lo = parseInt(m[1], 10);
  const hi = parseInt(m[2], 10);
  if (lo <= -2_000_000_000) return `Declining (<${hi}%)`;
  if (hi >= 2_000_000_000) return `High growth (>${lo}%)`;
  return `${lo}–${hi}% growth`;
}

/** Parse urn:li:yearsOfExperience:3 → "3+ yrs experience" */
function resolveYearsOfExperience(id: string): string {
  const n = parseInt(id, 10);
  if (isNaN(n)) return id;
  return n >= 12 ? "12+ yrs experience" : `${n}+ yrs experience`;
}

function resolveLinkedInUrn(facetKey: string, urn: string): string {
  // Extract the last segment after the final ":"    for range URNs like
  // urn:li:ageRange:(18,24) this gives "(18,24)"; for simple ones like
  // urn:li:gender:FEMALE it gives "FEMALE".
  const colonIdx = urn.indexOf(":(");
  const id = colonIdx !== -1
    ? urn.slice(colonIdx + 1)               // keep the range tuple "(18,24)"
    : String(urn).split(":").pop() || urn;  // plain last segment

  switch (facetKey) {
    case "interfaceLocales": return resolveLocale(id);
    case "genders": return resolveGender(id);
    case "ageRanges": return resolveAgeRange(id);
    case "staffCountRanges": return resolveStaffCount(id);
    case "growthRate": return resolveGrowthRate(id);
    case "yearsOfExperienceRanges": return resolveYearsOfExperience(id);
    default:
      // Will be replaced with a proper value once static maps are built
      // from the linkedInAds.standardizedData.* Postman endpoints.
      return id;
  }
}

function parseLinkedInTargeting(targetingCriteria: any): Array<{ label: string; content: string }> {
  const andBlocks = targetingCriteria?.include?.and;
  if (!Array.isArray(andBlocks)) return [];

  const facetMap = new Map<string, string[]>();
  for (const block of andBlocks) {
    const orData = block?.or;
    if (!orData || typeof orData !== "object") continue;
    for (const [facetUrn, values] of Object.entries(orData)) {
      if (!Array.isArray(values) || values.length === 0) continue;
      const facetKey = String(facetUrn).split(":").pop() || facetUrn;
      if (!facetMap.has(facetKey)) facetMap.set(facetKey, []);
      facetMap.get(facetKey)!.push(...(values as string[]));
    }
  }

  const results: Array<{ label: string; content: string }> = [];
  for (const [facetKey, urns] of facetMap.entries()) {
    const label = LINKEDIN_FACET_LABELS[facetKey] ||
      facetKey.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (m) => m.toUpperCase());

    let names: string[];
    names = urns.map((urn) => resolveLinkedInUrn(facetKey, urn));

    if (names.length > 0) {
      results.push({ label, content: names.join(", ") });
    }
  }
  return results;
}

function toTitleFromKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function extractLinkedInNumericId(input: any): string {
  const s = String(input ?? "");
  if (!s) return "";
  if (s.startsWith("urn:li:")) return s.split(":").pop() || "";
  return s.replace(/[^0-9]/g, "");
}

function CampaignTargeting({ campaignId, targetingCriteria }: { campaignId: string | number; targetingCriteria: any }) {
  const [debugOpen, setDebugOpen] = React.useState(false);

  const hasTargeting = React.useMemo(() => {
    return Array.isArray(targetingCriteria?.include?.and) && targetingCriteria.include.and.length > 0;
  }, [targetingCriteria]);

  const { data, isLoading } = trpc.linkedInAds.campaigns.resolveTargetingCriteria.useQuery(
    { targetingCriteria },
    { enabled: hasTargeting, refetchOnWindowFocus: false, retry: 1, staleTime: 10 * 60 * 1000 },
  );

  if (!hasTargeting) return null;

  const debugEntries = data?.debug ?? [];
  const hasDebug = debugEntries.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Crosshair className="h-4 w-4" />
          <span>Targeting</span>
        </div>
        {!isLoading && hasDebug && (
          <button
            type="button"
            onClick={() => setDebugOpen(o => !o)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {debugOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {debugOpen ? "Hide" : "Show"} raw API responses
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : (data?.data?.length ?? 0) > 0 ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-4">
          {data!.data.map((entry) => (
            <TargetingField
              key={`${campaignId}-${entry.label}`}
              label={entry.label}
              content={entry.content}
            />
          ))}
        </div>
      ) : null}

      {debugOpen && hasDebug && (
        <div className="space-y-2 mt-1">
          {debugEntries.map((d) => (
            <details key={d.facetKey} className="rounded-lg border border-dashed border-muted-foreground/30 text-xs">
              <summary className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer select-none hover:bg-muted/30 rounded-lg">
                <span className="font-mono font-semibold text-foreground">{d.facetKey}</span>
                <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${d.statusCode >= 200 && d.statusCode < 300 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
                  {d.statusCode || "ERR"}
                </span>
                <span className="text-muted-foreground">{d.resolvedCount} resolved</span>
              </summary>
              <div className="px-3 pb-3 space-y-1.5">
                <p className="text-muted-foreground break-all"><span className="font-semibold">URL: </span>{d.url}</p>
                <pre className="bg-muted/50 rounded p-2 text-[11px] leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap break-all">
                  {(() => { try { return JSON.stringify(JSON.parse(d.rawResponse), null, 2); } catch { return d.rawResponse; } })()}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function TargetingField({ label, content }: { label: string; content: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [showToggle, setShowToggle] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !content) return;
    if (!expanded && el.scrollHeight > el.clientHeight) setShowToggle(true);
  }, [content, expanded]);

  const hasContent = content.trim().length > 0;
  return (
    <div className="space-y-1.5">
      <div className="text-[13px] font-semibold text-primary">{label}</div>
      <p
        ref={ref}
        className={`text-sm tracking-wide ${!expanded ? "line-clamp-3" : ""} ${!hasContent ? "text-muted-foreground italic" : ""}`}
      >
        {hasContent ? content : " "}
      </p>
      {showToggle && hasContent && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-primary hover:bg-primary/10 text-xs font-medium"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5 mr-0.5" />Show less</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5 mr-0.5" />Show more</>
          )}
        </Button>
      )}
    </div>
  );
}

function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return " ";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return " ";
  return `${(num * 100).toFixed(2)}%`;
}

function getDynamicInsightMetricCards(insights: Record<string, any> | null | undefined, currency: string): Array<{ label: string; value: string; tone: MetricTone }> {
  if (!insights) return [];

  const toneByKey: Record<string, MetricTone> = {
    impressions: "purple",
    clicks: "green",
    spend: "emerald",
    costInLocalCurrency: "emerald",
    cpc: "indigo",
    ctr: "blue",
    externalWebsiteConversions: "orange",
    oneClickLeads: "orange",
    videoViews: "blue",
    videoCompletions: "indigo",
  };

  const preferredOrder = [
    "impressions",
    "clicks",
    "spend",
    "cpc",
    "ctr",
    "oneClickLeads",
    "externalWebsiteConversions",
    "videoViews",
    "videoCompletions",
  ];

  const keys = Object.keys(insights).filter((key) => insights[key] !== null && insights[key] !== undefined);
  const orderedKeys = [
    ...preferredOrder.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !preferredOrder.includes(key)),
  ];

  return orderedKeys.map((key) => {
    const rawValue = insights[key];
    const lower = key.toLowerCase();
    let value = formatNumber(rawValue);
    if (lower.includes("spend") || lower.includes("cost") || key === "cpc") value = formatCurrency(rawValue, currency);
    if (lower.includes("ctr") || lower.includes("rate")) value = formatPercent(rawValue);

    return {
      label: toTitleFromKey(key),
      value,
      tone: toneByKey[key] || "blue",
    };
  });
}

export default function LinkedInCampaignDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const accountId = String(params?.accountId || "");
  const campaignGroupId = String(params?.campaignId || "");
  const normalizeLinkedInId = React.useCallback((value: string) => value.replace(/[^0-9]/g, ""), []);
  const normalizedCampaignGroupId = React.useMemo(
    () => normalizeLinkedInId(campaignGroupId),
    [campaignGroupId, normalizeLinkedInId]
  );

  React.useEffect(() => {
    if (campaignGroupId) {
      captureEvent("linkedin_ads_campaign_viewed", { campaign_id: campaignGroupId });
    }
  }, [campaignGroupId]);

  const timeRange = React.useMemo(
    () => ({
      since: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      until: format(new Date(), "yyyy-MM-dd"),
    }),
    []
  );

  const {
    data: accountData,
    isLoading: isLoadingAccount,
    isFetching: isFetchingAccount,
    refetch: refetchAccount,
  } = trpc.linkedInAds.accounts.getAccountDetails.useQuery(
    { accountId },
    { enabled: !!accountId, refetchOnWindowFocus: false, retry: 1, staleTime: 0, refetchOnMount: "always" }
  );

  const {
    data: campaignGroupsData,
    isLoading: isLoadingCampaignGroups,
    isFetching: isFetchingCampaignGroups,
    error: campaignGroupError,
    refetch: refetchCampaignGroups,
  } = trpc.linkedInAds.campaignGroups.listCampaignGroups.useQuery(
    { accountId, timeRange },
    { enabled: !!accountId, refetchOnWindowFocus: false, retry: 1, staleTime: 0, refetchOnMount: "always" }
  );

  const campaignGroup = React.useMemo(() => {
    const groups = campaignGroupsData?.data || [];
    return (
      groups.find((group: any) => {
        const groupIdRaw = String(group.id ?? "");
        return (
          groupIdRaw === campaignGroupId ||
          normalizeLinkedInId(groupIdRaw) === normalizedCampaignGroupId
        );
      }) || null
    );
  }, [campaignGroupsData, campaignGroupId, normalizedCampaignGroupId, normalizeLinkedInId]);

  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    isFetching: isFetchingCampaigns,
    refetch: refetchCampaigns,
  } = trpc.linkedInAds.campaigns.listCampaigns.useQuery(
    { accountId, campaignGroupId: normalizedCampaignGroupId || campaignGroupId, timeRange },
    {
      enabled: !!accountId && !!campaignGroupId && !!campaignGroup,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0,
      refetchOnMount: "always",
    }
  );

  const campaigns = [...(campaignsData?.data || [])].sort((a: any, b: any) => {
    const aTime = a.changeAuditStamps?.lastModified?.time ?? a.changeAuditStamps?.created?.time ?? 0;
    const bTime = b.changeAuditStamps?.lastModified?.time ?? b.changeAuditStamps?.created?.time ?? 0;
    return bTime - aTime;
  });
  const currency = accountData?.data?.currency || "USD";
  const campaignIds = React.useMemo(() => campaigns.map((campaign: any) => String(campaign.id)), [campaigns]);

  // ---------------------------------------------------------------------------
  // Reporting (LinkedIn adAnalytics) for charts (Google Ads-style blocks)
  // ---------------------------------------------------------------------------

  const insightsEnabled = !!accountId && !!campaignGroupId && !!campaignGroup;

  const { data: dailyPerformanceData, isLoading: isLoadingDailyPerformance } =
    trpc.linkedInAds.insights.getDailyPerformance.useQuery(
      { accountId, campaignGroupId, timeRange },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 2 * 60 * 1000 }
    );

  const { data: deviceBreakdownData, isLoading: isLoadingDeviceBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "IMPRESSION_DEVICE_TYPE" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 }
    );

  const { data: placementBreakdownData, isLoading: isLoadingPlacementBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "PLACEMENT_NAME" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 }
    );

  const { data: servingLocationBreakdownData, isLoading: isLoadingServingLocationBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "SERVING_LOCATION" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 }
    );

  const { data: companySizeBreakdownData, isLoading: isLoadingCompanySizeBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "MEMBER_COMPANY_SIZE" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 10 * 60 * 1000 }
    );

  const { data: seniorityBreakdownData, isLoading: isLoadingSeniorityBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "MEMBER_SENIORITY" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 10 * 60 * 1000 }
    );

  const { data: jobFunctionBreakdownData, isLoading: isLoadingJobFunctionBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "MEMBER_JOB_FUNCTION" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 10 * 60 * 1000 }
    );

  const { data: industryBreakdownData, isLoading: isLoadingIndustryBreakdown } =
    trpc.linkedInAds.insights.getBreakdown.useQuery(
      { accountId, campaignGroupId, timeRange, pivot: "MEMBER_INDUSTRY" },
      { enabled: insightsEnabled, refetchOnWindowFocus: false, retry: 1, staleTime: 10 * 60 * 1000 }
    );

  const {
    data: accountCreativesData,
    isLoading: isLoadingAccountCreatives,
    isFetching: isFetchingAccountCreatives,
    refetch: refetchAccountCreatives,
  } = trpc.linkedInAds.creatives.listAccountCreatives.useQuery(
    { accountId, pageSize: 100, campaignIds },
    {
      enabled: !!accountId && campaigns.length > 0,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0,
      refetchOnMount: "always",
    }
  );

  const allCreativeIds = React.useMemo(() => {
    const accountCreatives = accountCreativesData?.data || [];
    return accountCreatives
      .map((c: any) => c?.id)
      .filter((id: any) => id !== null && id !== undefined)
      .map((id: any) => String(id));
  }, [accountCreativesData]);

  const {
    data: creativeInsightsData,
    isFetching: isFetchingCreativeInsights,
    error: creativeInsightsError,
  } = trpc.linkedInAds.creatives.getCreativeInsights.useQuery(
    { accountId, creativeIds: allCreativeIds, timeRange },
    { enabled: !!accountId && allCreativeIds.length > 0, refetchOnWindowFocus: false, retry: 1, staleTime: 0, refetchOnMount: "always" }
  );

  const creativeInsightsById = creativeInsightsData?.data || {};

  const adsByAdSetId = React.useMemo(() => {
    const creatives = accountCreativesData?.data || [];
    const out: Record<string, any[]> = {};
    for (const c of creatives) {
      const adSetId = extractLinkedInNumericId(c?.campaign);
      if (!adSetId) continue;
      const creativeId = String(c?.id ?? "");
      if (!creativeId) continue;
      const insights = creativeInsightsById?.[creativeId] || null;
      if (!out[adSetId]) out[adSetId] = [];
      out[adSetId].push({
        ...c,
        id: creativeId,
        name: c?.name || `Ad ${creativeId}`,
        insights,
      });
    }
    for (const [k, arr] of Object.entries(out)) {
      out[k] = (arr || [])
        .slice()
        .sort((a: any, b: any) => Number(b?.insights?.impressions || 0) - Number(a?.insights?.impressions || 0));
    }
    return out;
  }, [accountCreativesData, creativeInsightsById]);

  const bulkTargetingItems = React.useMemo(() => {
    return (campaigns || [])
      .filter((c: any) => !!c?.targetingCriteria)
      .map((c: any) => ({ campaignId: String(c.id), targetingCriteria: c.targetingCriteria }));
  }, [campaigns]);

  const { data: targetingBulkData } = trpc.linkedInAds.campaigns.resolveTargetingCriteriaBulk.useQuery(
    { items: bulkTargetingItems },
    { enabled: bulkTargetingItems.length > 0, refetchOnWindowFocus: false, retry: 1, staleTime: 10 * 60 * 1000 }
  );

  const targetingByAdSetId = targetingBulkData?.data || {};

  const [previewCreative, setPreviewCreative] = React.useState<any | null>(null);
  const previewCreativeId = previewCreative ? String(previewCreative.id) : null;
  const {
    data: creativePreviewData,
    isLoading: isLoadingCreativePreview,
  } = trpc.linkedInAds.creatives.getCreativePreview.useQuery(
    {
      accountId,
      creativeId: previewCreativeId || "",
      livePreviewCreative: previewCreative
        ? {
            campaign: String(previewCreative.campaign || ""),
            intendedStatus: previewCreative.intendedStatus || undefined,
            contentReference: previewCreative.contentReference || undefined,
            inlineContent: previewCreative.inlineContent || undefined,
          }
        : undefined,
    },
    { enabled: !!accountId && !!previewCreativeId, refetchOnWindowFocus: false, retry: 1 }
  );

  const isFetchingCreatives = isFetchingAccountCreatives;

  const metrics = React.useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;
    let totalConversions = 0;
    let totalOneClickLeads = 0;
    let totalVideoViews = 0;
    let totalVideoCompletions = 0;

    campaigns.forEach((campaign: any) => {
      totalImpressions += Number(campaign?.insights?.impressions || 0);
      totalClicks += Number(campaign?.insights?.clicks || 0);
      totalSpend += Number(campaign?.insights?.spend || 0);
      totalConversions += Number(campaign?.insights?.externalWebsiteConversions || 0);
      totalOneClickLeads += Number(campaign?.insights?.oneClickLeads || 0);
      totalVideoViews += Number(campaign?.insights?.videoViews || 0);
      totalVideoCompletions += Number(campaign?.insights?.videoCompletions || 0);
    });

    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return {
      totalImpressions,
      totalClicks,
      totalSpend,
      totalConversions,
      totalOneClickLeads,
      totalVideoViews,
      totalVideoCompletions,
      avgCPC,
      avgCTR,
    };
  }, [campaigns]);

  const hasAnyCampaignInsights = React.useMemo(
    () =>
      campaigns.some((campaign: any) => {
        const insights = campaign?.insights;
        if (!insights) return false;
        return ["impressions", "clicks", "spend", "externalWebsiteConversions", "oneClickLeads", "videoViews"].some(
          (k) => insights[k] !== null && insights[k] !== undefined
        );
      }),
    [campaigns]
  );

  const isRefreshing = isFetchingAccount || isFetchingCampaignGroups || isFetchingCampaigns || isFetchingCreatives || isFetchingCreativeInsights;

  React.useEffect(() => {
    if (campaignGroupError) {
      toast.error(campaignGroupError.message || "Failed to load LinkedIn campaign details");
    }
  }, [campaignGroupError]);

  const handleRefresh = async () => {
    await Promise.all([refetchAccount(), refetchCampaignGroups(), refetchCampaigns(), refetchAccountCreatives()]);
    await utils.linkedInAds.invalidate();
    toast.success("Campaign data refreshed");
  };

  if (isLoadingAccount || isLoadingCampaignGroups) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!campaignGroup) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Campaign</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Campaign not found for this account or access is unavailable.
              </p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold tracking-tight truncate">
                {campaignGroup.name || `Campaign Group ${campaignGroup.id}`}
              </h1>
              <p className="text-xs text-muted-foreground">LinkedIn Ads campaign group details</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="rounded-full h-8 gap-2">
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <DownloadLinkedInAdsReportButton
              campaignGroup={campaignGroup}
              accountName={accountData?.data?.name || accountData?.data?.accountName || accountId}
              currency={currency}
              timeRange={timeRange}
              totals={{
                impressions: metrics.totalImpressions,
                clicks: metrics.totalClicks,
                spend: metrics.totalSpend,
                conversions: metrics.totalConversions,
                avgCpc: metrics.avgCPC,
                avgCtr: metrics.avgCTR,
              }}
              dailyPerformance={dailyPerformanceData?.data || []}
              breakdowns={{
                device: deviceBreakdownData?.data || [],
                placement: placementBreakdownData?.data || [],
                servingLocation: servingLocationBreakdownData?.data || [],
                companySize: companySizeBreakdownData?.data || [],
                seniority: seniorityBreakdownData?.data || [],
                jobFunction: jobFunctionBreakdownData?.data || [],
                industry: industryBreakdownData?.data || [],
              }}
              adsByAdSetId={adsByAdSetId}
              adSets={(campaigns || []).map((c: any) => ({
                id: String(c.id),
                name: c.name || `Campaign ${c.id}`,
                status: c.status,
                insights: c.insights,
                targetingSummary: targetingByAdSetId?.[String(c.id)] || parseLinkedInTargeting(c?.targetingCriteria),
              }))}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h2 className="text-lg font-semibold">Overview</h2>
          </div>

          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Campaign Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusStyles(campaignGroup.status).variant} className={statusStyles(campaignGroup.status).className}>
                    {humanizeLabel(campaignGroup.status)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Campaign Group ID</p>
                  <p className="text-sm font-medium">{campaignGroup.id}</p>
                </div>
                {campaignGroup.created && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{new Date(campaignGroup.created).toLocaleDateString()}</p>
                  </div>
                )}
                {campaignGroup.lastModified && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Last Modified</p>
                    <p className="text-sm font-medium">{new Date(campaignGroup.lastModified).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAnyCampaignInsights && (
                <p className="text-xs text-muted-foreground mb-3">
                  Analytics metrics are unavailable for this selection (no activity yet, reporting permission missing, or API returned an empty reporting response).
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                <MetricBox label="Impressions" value={formatNumber(metrics.totalImpressions)} tone="purple" />
                <MetricBox label="Clicks" value={formatNumber(metrics.totalClicks)} tone="green" />
                <MetricBox label="Amount Spent" value={formatCurrency(metrics.totalSpend, currency)} tone="emerald" />
                <MetricBox label="Conversions" value={formatNumber(metrics.totalConversions)} tone="orange" />
                <MetricBox label="Avg CPC" value={formatCurrency(metrics.avgCPC, currency)} tone="indigo" />
                <MetricBox label="Avg CTR" value={`${metrics.avgCTR.toFixed(2)}%`} tone="blue" />
                <MetricBox label="One Click Leads" value={formatNumber(metrics.totalOneClickLeads)} tone="orange" />
                <MetricBox label="Video Views" value={formatNumber(metrics.totalVideoViews)} tone="blue" />
                <MetricBox label="Video Completions" value={formatNumber(metrics.totalVideoCompletions)} tone="indigo" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-base font-semibold">Ad sets</h3>
            {isLoadingCampaigns ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="bg-card shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">No ad sets found for this campaign group.</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="w-full space-y-3">
                {campaigns.map((campaign: any) => {
                  return (
                    <AccordionItem key={campaign.id} value={String(campaign.id)} className="border rounded-lg bg-card px-4">
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex w-full items-start justify-between gap-3 pr-4">
                          <div className="min-w-0 text-left">
                            <p className="text-sm font-semibold truncate">{campaign.name || `Campaign ${campaign.id}`}</p>
                            <p className="text-xs text-muted-foreground">ID: {campaign.id}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                              Click for full details
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              Ads
                            </Badge>
                            <Badge variant={statusStyles(campaign.status).variant} className={statusStyles(campaign.status).className}>
                                      {humanizeLabel(campaign.status)}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {getDynamicInsightMetricCards(campaign?.insights, currency).map((metric) => (
                            <MetricMini key={`${campaign.id}-${metric.label}`} label={metric.label} value={metric.value} tone={metric.tone} />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          <MetricMini label="Objective" value={humanizeLabel(campaign?.objectiveType)} />
                          <MetricMini label="Cost Type" value={humanizeLabel(campaign?.costType)} />
                          <MetricMini label="Optimization" value={humanizeLabel(campaign?.optimizationTargetType)} />
                          <MetricMini label="Campaign Type" value={humanizeLabel(campaign?.type)} />
                          <MetricMini label="Format" value={humanizeLabel(campaign?.format)} />
                        </div>
                        {Array.isArray(campaign?.servingStatuses) && campaign.servingStatuses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {campaign.servingStatuses.map((status: string, idx: number) => (
                              <Badge key={`${campaign.id}-serving-${idx}`} variant="secondary" className="text-[10px]">
                                {humanizeLabel(status)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <CampaignTargeting
                          campaignId={campaign.id}
                          targetingCriteria={campaign?.targetingCriteria}
                        />
                        <Separator />
                        <CampaignAdsAccordion
                          accountId={accountId}
                          campaignId={String(campaign.id)}
                          currency={currency}
                          timeRange={timeRange}
                          previewCreativeId={previewCreativeId}
                          setPreviewCreative={setPreviewCreative}
                          isLoadingCreativePreview={isLoadingCreativePreview}
                          creativePreviewData={creativePreviewData}
                          statusStyles={statusStyles}
                          humanizeLabel={humanizeLabel}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          {/* Performance Trends (Google Ads-style) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Performance Trends</h2>
            </div>

            <Card className="border-muted/60 shadow-none overflow-hidden bg-muted/5">
              <CardHeader className="border-b border-muted/60 py-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Daily Activity</CardTitle>
                    <p className="text-xs text-muted-foreground">Impressions, clicks, and spend over time</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingDailyPerformance ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (dailyPerformanceData?.data || []).length > 0 ? (
                  <ChartContainer
                    config={
                      {
                        impressions: { label: "Impressions", color: "var(--chart-2)" },
                        clicks: { label: "Clicks", color: "var(--chart-1)" },
                        spend: { label: "Spend", color: "var(--chart-3)" },
                      } satisfies ChartConfig
                    }
                    className="h-[320px] w-full"
                  >
                    {(() => {
                      const rows = dailyPerformanceData?.data || [];
                      const max = Math.max(
                        0,
                        ...rows.flatMap((r: any) => [
                          Number(r?.impressions ?? 0),
                          Number(r?.clicks ?? 0),
                          Number(r?.spend ?? 0),
                        ])
                      );
                      const ticks = buildSmartTicks(max);
                      const domainMax = getSmartYAxisDomainMax(max);
                      return (
                        <LineChart data={rows}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(val) => (val ? format(new Date(val), "MMM dd") : "")}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={formatCompactNumber}
                            ticks={ticks}
                            domain={[0, domainMax]}
                            allowDataOverflow
                            interval={0}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line type="monotone" dataKey="impressions" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="clicks" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="spend" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      );
                    })()}
                  </ChartContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-muted-foreground italic text-sm border border-dashed rounded-lg bg-background">
                    No daily performance data available for this range
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-6">
              <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col flex-1 min-w-[260px]">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Daily Spend</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] pt-6">
                  {isLoadingDailyPerformance ? (
                    <Skeleton className="h-full w-full" />
                  ) : (dailyPerformanceData?.data || []).length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          spend: { label: "Spend", color: "var(--chart-3)" },
                        } satisfies ChartConfig
                      }
                      className="h-full w-full"
                    >
                      <AreaChart data={dailyPerformanceData?.data || []}>
                        <defs>
                          <linearGradient id="liFillSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9 }}
                          tickFormatter={(val) => (val ? format(new Date(val), "MMM dd") : "")}
                        />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="spend" stroke="var(--chart-3)" fill="url(#liFillSpend)" strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col flex-1 min-w-[260px]">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] pt-6">
                  {isLoadingDeviceBreakdown ? (
                    <Skeleton className="h-full w-full" />
                  ) : (deviceBreakdownData?.data || []).length > 0 ? (
                    (() => {
                      const rows = toTopNBreakdownRows(deviceBreakdownData?.data, "impressions", 6);
                      const { config: cfg, nameToKey } = buildCategoryChartConfig(rows);
                      const pieData = rows.map((d) => ({
                        name: nameToKey[String(d.name || "Unknown")] || "unknown",
                        value: d.value,
                        fill: `var(--color-${nameToKey[String(d.name || "Unknown")] || "unknown"})`,
                      }));
                      return (
                        <ChartContainer config={cfg} className="h-full w-full">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              innerRadius={40}
                              paddingAngle={2}
                            >
                              {pieData.map((d, idx) => (
                                <Cell key={idx} fill={d.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                          </PieChart>
                        </ChartContainer>
                      );
                    })()
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col flex-1 min-w-[260px]">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Placement Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] pt-6">
                  {isLoadingPlacementBreakdown ? (
                    <Skeleton className="h-full w-full" />
                  ) : (placementBreakdownData?.data || []).length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          impressions: { label: "Impressions", color: "var(--chart-1)" },
                          clicks: { label: "Clicks", color: "var(--chart-2)" },
                        } satisfies ChartConfig
                      }
                      className="h-full w-full"
                    >
                      <BarChart
                        data={toTopNBreakdownRowsMulti(placementBreakdownData?.data, 8)}
                        layout="vertical"
                        margin={{ left: 10, right: 10 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} width={95} />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="impressions" fill="var(--color-impressions)" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[0, 4, 4, 0]} barSize={10} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60 shadow-none overflow-hidden flex flex-col flex-1 min-w-[260px]">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Serving Location</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] pt-6">
                  {isLoadingServingLocationBreakdown ? (
                    <Skeleton className="h-full w-full" />
                  ) : (servingLocationBreakdownData?.data || []).length > 0 ? (
                    (() => {
                      const rows = toTopNBreakdownRows(servingLocationBreakdownData?.data, "impressions", 6);
                      const { config: cfg, nameToKey } = buildCategoryChartConfig(rows);
                      const pieData = rows.map((d) => ({
                        name: nameToKey[String(d.name || "Unknown")] || "unknown",
                        value: d.value,
                        fill: `var(--color-${nameToKey[String(d.name || "Unknown")] || "unknown"})`,
                      }));
                      return (
                        <ChartContainer config={cfg} className="h-full w-full">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              innerRadius={40}
                              paddingAngle={2}
                            />
                            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                          </PieChart>
                        </ChartContainer>
                      );
                    })()
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-muted/60 shadow-none overflow-hidden w-full">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Company Size</CardTitle>
                </CardHeader>
                <CardContent className="h-[520px] pt-6">
                  {isLoadingCompanySizeBreakdown ? (
                    <Skeleton className="h-full w-full" />
                  ) : (companySizeBreakdownData?.data || []).length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          impressions: { label: "Impressions", color: "var(--chart-2)" },
                          clicks: { label: "Clicks", color: "var(--chart-1)" },
                          videoViews: { label: "Video Views", color: "var(--chart-5)" },
                          leads: { label: "Leads", color: "var(--chart-4)" },
                          spend: { label: "Spend", color: "var(--chart-3)" },
                        } satisfies ChartConfig
                      }
                      className="h-full w-full"
                    >
                      {(() => {
                        const rows = toTopNBreakdownRowsMulti(companySizeBreakdownData?.data, 12);
                        const max = Math.max(
                          0,
                          ...rows.flatMap((r) => [r.impressions, r.clicks, r.videoViews, r.leads, r.spend])
                        );
                        const ticks = buildSmartTicks(max);
                        const domainMax = getSmartYAxisDomainMax(max);
                        const axisH = calcVerticalTickHeight(rows.map((r) => r?.name), 9);
                        return (
                      <LineChart data={rows} margin={{ left: 24, right: 24, bottom: axisH }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={<VerticalXAxisTick />}
                          tickMargin={12}
                          height={axisH}
                          interval={0}
                          minTickGap={0}
                          padding={{ left: 12, right: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={formatCompactNumber}
                          ticks={ticks}
                          domain={[0, domainMax]}
                          allowDataOverflow
                          interval={0}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="videoViews" stroke="var(--color-videoViews)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="spend" stroke="var(--color-spend)" strokeWidth={2} dot={false} />
                      </LineChart>
                        );
                      })()}
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60 shadow-none overflow-hidden w-full">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Seniority</CardTitle>
                </CardHeader>
                <CardContent className="h-[520px] pt-6">
                  {isLoadingSeniorityBreakdown ? (
                    <Skeleton className="h-full w-full" />
                  ) : (seniorityBreakdownData?.data || []).length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          impressions: { label: "Impressions", color: "var(--chart-2)" },
                          clicks: { label: "Clicks", color: "var(--chart-1)" },
                          videoViews: { label: "Video Views", color: "var(--chart-5)" },
                          leads: { label: "Leads", color: "var(--chart-4)" },
                          spend: { label: "Spend", color: "var(--chart-3)" },
                        } satisfies ChartConfig
                      }
                      className="h-full w-full"
                    >
                      {(() => {
                        const rows = toTopNBreakdownRowsMulti(seniorityBreakdownData?.data, 12);
                        const max = Math.max(
                          0,
                          ...rows.flatMap((r) => [r.impressions, r.clicks, r.videoViews, r.leads, r.spend])
                        );
                        const ticks = buildSmartTicks(max);
                        const domainMax = getSmartYAxisDomainMax(max);
                        const axisH = calcVerticalTickHeight(rows.map((r) => r?.name), 9);
                        return (
                      <LineChart data={rows} margin={{ left: 24, right: 24, bottom: axisH }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={<VerticalXAxisTick />}
                          tickMargin={12}
                          height={axisH}
                          interval={0}
                          minTickGap={0}
                          padding={{ left: 12, right: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={formatCompactNumber}
                          ticks={ticks}
                          domain={[0, domainMax]}
                          allowDataOverflow
                          interval={0}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="videoViews" stroke="var(--color-videoViews)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="spend" stroke="var(--color-spend)" strokeWidth={2} dot={false} />
                      </LineChart>
                        );
                      })()}
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60 shadow-none overflow-hidden w-full">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Job Function</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingJobFunctionBreakdown ? (
                    <Skeleton className="h-[520px] w-full" />
                  ) : (jobFunctionBreakdownData?.data || []).length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          impressions: { label: "Impressions", color: "var(--chart-2)" },
                          clicks: { label: "Clicks", color: "var(--chart-1)" },
                          videoViews: { label: "Video Views", color: "var(--chart-5)" },
                          leads: { label: "Leads", color: "var(--chart-4)" },
                          spend: { label: "Spend", color: "var(--chart-3)" },
                        } satisfies ChartConfig
                      }
                      className="w-full"
                    >
                      {(() => {
                        const rows = toTopNBreakdownRowsMulti(jobFunctionBreakdownData?.data, 12);
                        const axisH = calcVerticalTickHeight(rows.map((r) => r?.name), 9);
                        const plotH = 320;
                        const chartH = axisH + plotH;
                        const max = Math.max(
                          0,
                          ...rows.flatMap((r) => [r.impressions, r.clicks, r.videoViews, r.leads, r.spend])
                        );
                        const ticks = buildSmartTicks(max);
                        const domainMax = getSmartYAxisDomainMax(max);
                        return (
                      <LineChart height={chartH} data={rows} margin={{ left: 24, right: 24, bottom: axisH }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={<VerticalXAxisTick />}
                          tickMargin={12}
                          height={axisH}
                          interval={0}
                          minTickGap={0}
                          padding={{ left: 12, right: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={formatCompactNumber}
                          ticks={ticks}
                          domain={[0, domainMax]}
                          allowDataOverflow
                          interval={0}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="videoViews" stroke="var(--color-videoViews)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="spend" stroke="var(--color-spend)" strokeWidth={2} dot={false} />
                      </LineChart>
                        );
                      })()}
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted/60 shadow-none overflow-hidden w-full">
                <CardHeader className="pb-2 bg-muted/5 border-b border-muted/60 py-3">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60">Industry</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingIndustryBreakdown ? (
                    <Skeleton className="h-[520px] w-full" />
                  ) : (industryBreakdownData?.data || []).length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          impressions: { label: "Impressions", color: "var(--chart-2)" },
                          clicks: { label: "Clicks", color: "var(--chart-1)" },
                          videoViews: { label: "Video Views", color: "var(--chart-5)" },
                          leads: { label: "Leads", color: "var(--chart-4)" },
                          spend: { label: "Spend", color: "var(--chart-3)" },
                        } satisfies ChartConfig
                      }
                      className="w-full"
                    >
                      {(() => {
                        const rows = toTopNBreakdownRowsMulti(industryBreakdownData?.data, 12);
                        const axisH = calcVerticalTickHeight(rows.map((r) => r?.name), 9);
                        const plotH = 320;
                        const chartH = axisH + plotH;
                        const max = Math.max(
                          0,
                          ...rows.flatMap((r) => [r.impressions, r.clicks, r.videoViews, r.leads, r.spend])
                        );
                        const ticks = buildSmartTicks(max);
                        const domainMax = getSmartYAxisDomainMax(max);
                        return (
                      <LineChart height={chartH} data={rows} margin={{ left: 24, right: 24, bottom: axisH }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={<VerticalXAxisTick />}
                          tickMargin={12}
                          height={axisH}
                          interval={0}
                          minTickGap={0}
                          padding={{ left: 12, right: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={formatCompactNumber}
                          ticks={ticks}
                          domain={[0, domainMax]}
                          allowDataOverflow
                          interval={0}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="videoViews" stroke="var(--color-videoViews)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="spend" stroke="var(--color-spend)" strokeWidth={2} dot={false} />
                      </LineChart>
                        );
                      })()}
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase opacity-40 font-bold">
                      No Data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignAdsAccordion({
  accountId,
  campaignId,
  currency,
  timeRange,
  previewCreativeId,
  setPreviewCreative,
  isLoadingCreativePreview,
  creativePreviewData,
  statusStyles,
  humanizeLabel,
}: {
  accountId: string;
  campaignId: string;
  currency: string;
  timeRange: { since: string; until: string };
  previewCreativeId: string | null;
  setPreviewCreative: React.Dispatch<React.SetStateAction<any | null>>;
  isLoadingCreativePreview: boolean;
  creativePreviewData: any;
  statusStyles: (status?: string | null) => { variant: "outline" | "secondary" | "destructive"; className?: string };
  humanizeLabel: (value?: string | null) => string;
}) {
  const [open, setOpen] = React.useState<string>("");

  const enabled = open === "ads";
  const { data: adsData, isLoading: isLoadingAds } = trpc.linkedInAds.creatives.listAccountCreatives.useQuery(
    { accountId, pageSize: 100, campaignIds: [campaignId] },
    { enabled: enabled && !!accountId && !!campaignId, refetchOnWindowFocus: false, retry: 1, staleTime: 0 }
  );

  const ads = adsData?.data || [];
  const creativeIds = React.useMemo(() => ads.map((a: any) => String(a.id)).filter(Boolean), [ads]);

  const { data: insightsData, isFetching: isFetchingInsights, error: insightsError } =
    trpc.linkedInAds.creatives.getCreativeInsights.useQuery(
      { accountId, creativeIds, timeRange },
      { enabled: enabled && !!accountId && creativeIds.length > 0, refetchOnWindowFocus: false, retry: 1, staleTime: 0 }
    );

  const insightsById = insightsData?.data || {};

  return (
    <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v)} className="w-full">
      <AccordionItem value="ads" className="border rounded-lg bg-muted/10 px-3">
        <AccordionTrigger className="py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Ads</p>
              <p className="text-[11px] text-muted-foreground">Open to load ad metrics and previews.</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-[10px] font-bold uppercase tracking-wider opacity-70">
              Click for full report
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 space-y-3">
          {isLoadingAds ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : ads.length === 0 ? (
            <p className="text-xs text-muted-foreground">No ads found for this campaign.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ads.map((creative: any) => (
                <div key={creative.id} className="rounded-md border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{creative.name || `Ad ${creative.id}`}</p>
                    </div>
                    <Badge variant={statusStyles(creative.intendedStatus).variant} className={statusStyles(creative.intendedStatus).className}>
                      {humanizeLabel(creative.intendedStatus)}
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <AdMetrics
                      creativeId={String(creative.id)}
                      insights={insightsById[String(creative.id)]}
                      currency={currency}
                      isLoading={isFetchingInsights}
                      errorMessage={insightsError?.message || null}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {creative.reviewStatus && (
                      <Badge variant="outline" className="text-[10px]">{creative.reviewStatus}</Badge>
                    )}
                    {creative.isServing ? (
                      <Badge variant="outline" className="text-[10px]">SERVING</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">NOT SERVING</Badge>
                    )}
                    {(creative.servingHoldReasons || []).slice(0, 2).map((reason: string, idx: number) => (
                      <Badge key={`${creative.id}-reason-${idx}`} variant="secondary" className="text-[10px]">
                        {humanizeLabel(reason)}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() =>
                        setPreviewCreative((current: any) =>
                          current && String(current.id) === String(creative.id) ? null : creative
                        )
                      }
                    >
                      {previewCreativeId === String(creative.id) ? "Hide Ad Preview" : "Show Ad Preview"}
                    </Button>
                  </div>

                  {previewCreativeId === String(creative.id) && (
                    <div className="mt-3 rounded-md border p-2 bg-muted/20">
                      {isLoadingCreativePreview ? (
                        <p className="text-xs text-muted-foreground">Loading preview...</p>
                      ) : (creativePreviewData?.data || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {creativePreviewData?.meta?.unsupportedCreativeType
                            ? "Preview is not supported for this ad type in LinkedIn Ad Preview API."
                            : "No preview available for this ad."}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(creativePreviewData?.data || []).map((previewItem: any, previewIdx: number) => (
                            <div key={`${creative.id}-preview-${previewIdx}`} className="overflow-auto">
                              {previewItem?.preview ? (
                                <div className="min-w-[320px]" dangerouslySetInnerHTML={{ __html: previewItem.preview }} />
                              ) : (
                                <p className="text-xs text-muted-foreground">Preview payload missing HTML.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

type MetricTone = "blue" | "orange" | "purple" | "emerald" | "green" | "indigo";

const metricToneClasses: Record<MetricTone, { bg: string; border: string; label: string; value: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
    label: "text-blue-700 dark:text-blue-300",
    value: "text-blue-900 dark:text-blue-100",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900",
    label: "text-orange-700 dark:text-orange-300",
    value: "text-orange-900 dark:text-orange-100",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900",
    label: "text-purple-700 dark:text-purple-300",
    value: "text-purple-900 dark:text-purple-100",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    label: "text-emerald-700 dark:text-emerald-300",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
    label: "text-green-700 dark:text-green-300",
    value: "text-green-900 dark:text-green-100",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-900",
    label: "text-indigo-700 dark:text-indigo-300",
    value: "text-indigo-900 dark:text-indigo-100",
  },
};

function MetricBox({ label, value, tone = "blue" }: { label: string; value: string; tone?: MetricTone }) {
  const colors = metricToneClasses[tone];
  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      <p className={`text-[11px] uppercase tracking-wide ${colors.label}`}>{label}</p>
      <p className={`text-sm font-semibold mt-1 ${colors.value}`}>{value}</p>
    </div>
  );
}

function MetricMini({ label, value, tone = "blue" }: { label: string; value: string; tone?: MetricTone }) {
  const colors = metricToneClasses[tone];
  return (
    <div className={`rounded-md border p-2 ${colors.bg} ${colors.border}`}>
      <p className={`text-[10px] uppercase tracking-wide ${colors.label}`}>{label}</p>
      <p className={`text-xs font-semibold mt-1 ${colors.value}`}>{value}</p>
    </div>
  );
}

function AdMetrics({
  creativeId,
  insights,
  currency,
  isLoading,
  errorMessage,
}: {
  creativeId: string;
  insights: Record<string, any> | null | undefined;
  currency: string;
  isLoading: boolean;
  errorMessage?: string | null;
}) {
  const [showAll, setShowAll] = React.useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={`${creativeId}-metric-skel-${idx}`} className="rounded-md border p-2 bg-muted/20">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
        <p className="text-xs text-destructive font-medium">Failed to load ad metrics</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{errorMessage}</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <p className="text-xs text-muted-foreground">
        Ad metrics are unavailable for this selection (no activity yet, reporting permission missing, or API returned an empty reporting response).
      </p>
    );
  }

  const cards = getDynamicInsightMetricCards(insights, currency);
  const primary = cards.slice(0, 8);
  const rest = cards.slice(8);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {primary.map((metric) => (
          <MetricMini
            key={`${creativeId}-ad-metric-${metric.label}`}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </div>
      {rest.length > 0 && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-primary hover:bg-primary/10 text-xs font-medium"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? (
              <><ChevronUp className="h-3.5 w-3.5 mr-0.5" />Hide all metrics</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5 mr-0.5" />Show all metrics</>
            )}
          </Button>
          {showAll && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {rest.map((metric) => (
                <MetricMini
                  key={`${creativeId}-ad-metric-all-${metric.label}`}
                  label={metric.label}
                  value={metric.value}
                  tone={metric.tone}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
