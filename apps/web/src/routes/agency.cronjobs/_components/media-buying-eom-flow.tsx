"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import debounce from "lodash.debounce";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./media-buying-eom-flow.css";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrencyConversion } from "@/routes/$slug.domains/_components/use-currency-conversion";
import { Document, Font, Page, pdf } from "@react-pdf/renderer";
import QRCodeUtil from "qrcode";
import { PdfDetails } from "@/routes/agency.invoicing/_components/form/pdfDetails";
import { pdfContainers } from "@/lib/pdfStyles";
import type { DateRange } from "react-day-picker";
import { toTimeRange } from "./media-buying-eom/date-range";

import type {
  GoogleAdsAccount,
  LinkedInAdsAccount,
  MetaCampaign,
  Product,
  ProductPlan,
  GoogleCampaign,
  LinkedInCampaignGroup,
} from "./media-buying-eom/types";
import { findMediaBuyingProduct } from "./media-buying-eom/find-media-buying";
import { parseNumberOrZero } from "./media-buying-eom/format";
import {
  GoogleCampaignsNode,
  LinkedInCampaignGroupsNode,
  MetaCampaignsNode,
} from "./media-buying-eom/campaign-nodes";
import {
  EndNode,
  FeeNode,
  GenerateInvoicesNode,
  InvoicePreviewNode,
  CurrencyConverterNode,
} from "./media-buying-eom/invoice-nodes";
import {
  MEDIA_BUYING_EOM_NODE_TYPE,
  mediaBuyingEomNodeTypes,
} from "./media-buying-eom/resizable-flow-node";
import { MediaBuyingEomFlowEdge } from "./media-buying-eom/flow-edge";
import type { InvoiceDefaults } from "./media-buying-eom/persist-types";
import {
  buildMediaBuyingGraphPayload,
  hydrateMediaBuyingFromGraph,
  type SelectedByParent,
} from "./media-buying-eom/persist";
import { toast } from "@/components/ui/sonner";

const EDGE_TYPE: Edge["type"] = "smoothstep";
type FlowStatus = "loading" | "success" | "error";

function edgeStrokeForStatus(status: FlowStatus) {
  if (status === "success") return "hsl(142 71% 35%)"; // green-600-ish
  if (status === "error") return "hsl(0 72% 51%)"; // red-500-ish
  return "var(--primary)";
}

/** Horizontal pipeline + stacked platform lanes (avoids overlapping tall account nodes). */
const MB_X = {
  start: 0,
  service: 260,
  plans: 520,
  endNoProduct: 820,
  hub: 920,
  accounts: 920,
  campaigns: 1360,
  fee: 1760,
  invoice: 2140,
  invoiceFrom: 2540,
  billTo: 2920,
  qr: 3300,
  generate: 3680,
  downloads: 4060,
  done: 4440,
} as const;

const MB_Y = {
  /** Start / service / plans row */
  left: 56,
  /** Platforms hub card */
  hub: 16,
  /** First platform lane (Meta) — below hub with clearance */
  metaLane: 140,
  laneStep: 430,
  stackGap: 450,
} as const;

const mbYGoogleLane = MB_Y.metaLane + MB_Y.laneStep;
const mbYLinkedInLane = MB_Y.metaLane + 2 * MB_Y.laneStep;

function pickCommissionRatePercent(plan: ProductPlan | null) {
  if (!plan) return 0;
  if (plan.pricingModel !== "COMMISSION") return 0;
  const n = plan.commissionRate != null ? Number(plan.commissionRate) : 0;
  return Number.isFinite(n) ? n : 0;
}

function sumSelectedInKes(
  selected: SelectedByParent,
  getKesRateForCurrency: (currency: string) => number
) {
  let total = 0;
  for (const byId of Object.values(selected)) {
    for (const v of Object.values(byId)) {
      const rate = getKesRateForCurrency(v.currency);
      total += v.spend * rate;
    }
  }
  return total;
}

function flattenLinesKes(
  selected: SelectedByParent,
  contextLabelByParent: (parentId: string) => string,
  getKesRateForCurrency: (currency: string) => number
) {
  const out: Array<{
    id: string;
    name: string;
    context: string;
    originalSpend: number;
    currency: string;
    spendKes: number;
  }> = [];
  for (const [parentId, byId] of Object.entries(selected)) {
    for (const v of Object.values(byId)) {
      const rate = getKesRateForCurrency(v.currency);
      out.push({
        id: `${parentId}:${v.id}`,
        name: v.name,
        context: contextLabelByParent(parentId),
        originalSpend: v.spend,
        currency: v.currency,
        spendKes: v.spend * rate,
      });
    }
  }
  return out;
}

function pickAccountCurrency(input: any): string {
  const c =
    input?.currency ??
    input?.currencyCode ??
    input?.accountCurrency ??
    input?.account_currency ??
    input?.account_currency_code ??
    input?.currency_code;
  const s = typeof c === "string" ? c.trim().toUpperCase() : "";
  return s || "KES";
}

function defaultLast30DaysRange(): DateRange {
  return {
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  };
}

// Font registration state (copied from invoicing download button)
let mbEomFontsRegistered = false;
let mbEomFontsRegistering = false;

async function registerMbEomFonts(): Promise<boolean> {
  if (mbEomFontsRegistered) return true;
  if (mbEomFontsRegistering) {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (mbEomFontsRegistered) {
          clearInterval(t);
          resolve(true);
        }
      }, 100);
    });
  }
  mbEomFontsRegistering = true;
  try {
    const fontWeights = [
      { name: "Geist-Thin.ttf", weight: "thin" },
      { name: "Geist-UltraLight.ttf", weight: "ultralight" },
      { name: "Geist-Light.ttf", weight: "light" },
      { name: "Geist-Regular.ttf", weight: "normal" },
      { name: "Geist-Medium.ttf", weight: "medium" },
      { name: "Geist-SemiBold.ttf", weight: "semibold" },
      { name: "Geist-Bold.ttf", weight: "bold" },
      { name: "Geist-UltraBlack.ttf", weight: "ultrabold" },
    ] as const;

    const fonts = await Promise.all(
      fontWeights.map(async ({ name, weight }) => {
        try {
          const response = await fetch(`/font/${name}`);
          if (!response.ok) return null;
          const fontData = await response.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(fontData).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          return {
            src: `data:font/truetype;base64,${base64}`,
            fontWeight: weight,
          };
        } catch {
          return null;
        }
      })
    );

    const validFonts = fonts.filter(Boolean) as Array<{
      src: string;
      fontWeight:
        | "thin"
        | "ultralight"
        | "light"
        | "normal"
        | "medium"
        | "semibold"
        | "bold"
        | "ultrabold";
    }>;

    if (validFonts.length > 0) {
      Font.register({
        family: "Geist",
        fonts: validFonts,
      });
      mbEomFontsRegistered = true;
      return true;
    }
    return false;
  } finally {
    mbEomFontsRegistering = false;
  }
}

function base64ToBlob(base64: string, mime = "application/pdf"): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

export type MediaBuyingEomFlowProps = {
  workflowRunId?: string | null;
  /** When false, wait before hydrating from `initialGraphState` (e.g. while getById is loading). */
  hydrationReady?: boolean;
  initialGraphState?: Record<string, unknown> | null;
  initialVersion?: number;
  initialInvoiceIds?: Partial<Record<"meta" | "google" | "linkedin", string>>;
  /** Fires when graph autosave to the server starts / finishes (for UI spinners). */
  onAutosaveStatusChange?: (state: { isSaving: boolean }) => void;
};

export function MediaBuyingEomTotalSpendInvoicesFlow({
  workflowRunId = null,
  hydrationReady = true,
  initialGraphState = null,
  initialVersion = 1,
  initialInvoiceIds = undefined,
  onAutosaveStatusChange,
}: MediaBuyingEomFlowProps = {}) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [selectedMetaAccountIds, setSelectedMetaAccountIds] = React.useState<
    string[]
  >([]);
  const [selectedGoogleCustomerIds, setSelectedGoogleCustomerIds] = React.useState<
    string[]
  >([]);
  const [selectedLinkedInAccountIds, setSelectedLinkedInAccountIds] =
    React.useState<string[]>([]);

  const [selectedMetaByAccount, setSelectedMetaByAccount] =
    React.useState<SelectedByParent>({});
  const [selectedGoogleByCustomer, setSelectedGoogleByCustomer] =
    React.useState<SelectedByParent>({});
  const [selectedLinkedInByAccount, setSelectedLinkedInByAccount] =
    React.useState<SelectedByParent>({});

  const [metaFeeInput, setMetaFeeInput] = React.useState("");
  const [googleFeeInput, setGoogleFeeInput] = React.useState("");
  const [linkedInFeeInput, setLinkedInFeeInput] = React.useState("");
  const [metaFeeCurrency, setMetaFeeCurrency] = React.useState("KES");
  const [googleFeeCurrency, setGoogleFeeCurrency] = React.useState("KES");
  const [linkedInFeeCurrency, setLinkedInFeeCurrency] = React.useState("KES");

  // Invoice generation steps state
  const [invoiceDefaults, setInvoiceDefaults] = React.useState<InvoiceDefaults>(() => ({
    yourName: "Nisc Cloud Limited",
    yourEmail: "accounts@nisccloud.com",
    yourAddress: "P.O BOX 21615 - 00505",
    yourCity: "Nairobi",
    yourState: "",
    yourCountry: "Kenya",
    yourTaxId: "P052377334H",
    yourZip: "",
    invoiceNo: "",
    issueDate: "",
    dueDate: "",
    discount: "",
    tax: "16",
    note: "",
    paymentMethod: "bank",
    bankName: "Absa Bank Plc",
    accountNumber: "2052676528",
    accountName: "Nisc Cloud Limited",
    branchName: "Hurlingham",
    branchCode: "045",
    swiftCode: "BARCKENX",
    mpesaPaybillNumber: "",
    mpesaAccountNumber: "",
    mpesaInstructions: "",
    chequeDeliveryAddress: "",
    chequeInstructions: "",
    qrCodeValue: "",
  }));
  const [selectedBillToTeamId, setSelectedBillToTeamId] = React.useState<string>("");
  const [qrStepDone, setQrStepDone] = React.useState(false);
  const [invoiceGenStatus, setInvoiceGenStatus] = React.useState<
    "idle" | "generating" | "generated" | "error"
  >("idle");
  const [generatedByPlatform, setGeneratedByPlatform] = React.useState<
    Partial<Record<"meta" | "google" | "linkedin", { pdfBase64: string }>>
  >({});
  const [generatedInvoiceIds, setGeneratedInvoiceIds] = React.useState<
    Partial<Record<"meta" | "google" | "linkedin", string>>
  >({});

  const [persistVersion, setPersistVersion] = React.useState(initialVersion);
  /** Source of truth for optimistic concurrency — updated before/after each save (not debounce closures). */
  const persistVersionRef = React.useRef(initialVersion);
  React.useEffect(() => {
    persistVersionRef.current = initialVersion;
    setPersistVersion(initialVersion);
  }, [initialVersion]);

  const persistUtils = trpc.useUtils();
  const persistUtilsRef = React.useRef(persistUtils);
  persistUtilsRef.current = persistUtils;

  const saveGraphMutation = trpc.cronWorkflowRun.saveGraph.useMutation({
    onSuccess: (d) => {
      persistVersionRef.current = d.version;
      setPersistVersion(d.version);
    },
  });

  React.useEffect(() => {
    onAutosaveStatusChange?.({ isSaving: saveGraphMutation.isPending });
  }, [saveGraphMutation.isPending, onAutosaveStatusChange]);
  const recordEdgeSnapshotMutation =
    trpc.cronWorkflowRun.recordEdgeSnapshot.useMutation();
  const linkInvoiceMutation = trpc.cronWorkflowRun.linkInvoice.useMutation();

  const [showBillingIncompleteDialog, setShowBillingIncompleteDialog] =
    React.useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = React.useState(false);

  const submitInvoiceMutation = trpc.invoicing.submitInvoice.useMutation();
  const teamsQuery = trpc.teamBilling.listTeams.useQuery();
  const [metaDateRangeByAccount, setMetaDateRangeByAccount] = React.useState<Record<string, DateRange | undefined>>({});
  const [googleDateRangeByCustomer, setGoogleDateRangeByCustomer] = React.useState<Record<string, DateRange | undefined>>({});
  const [linkedInDateRangeByAccount, setLinkedInDateRangeByAccount] = React.useState<Record<string, DateRange | undefined>>({});
  const teams = teamsQuery.data?.teams ?? [];
  const selectedTeam = teams.find((t) => t.id === selectedBillToTeamId);
  const billingSettings = (selectedTeam as any)?.billingSettings ?? null;
  const billingComplete = React.useMemo(() => {
    if (!billingSettings) return false;
    const required = ["legalName", "billingEmail", "addressLine1", "city", "country"] as const;
    return required.every((k) => typeof billingSettings?.[k] === "string" && billingSettings[k].trim().length > 0);
  }, [billingSettings]);

  React.useEffect(() => {
    if (!selectedBillToTeamId) {
      setShowBillingIncompleteDialog(false);
      return;
    }
    if (!billingComplete) setShowBillingIncompleteDialog(true);
    else setShowBillingIncompleteDialog(false);
  }, [selectedBillToTeamId, billingComplete]);

  const productsQuery = trpc.products.getAll.useQuery(
    { isActive: true },
    { refetchOnWindowFocus: false }
  );
  const productsData = productsQuery.data;
  const products = React.useMemo(
    () => (productsData ?? []) as unknown as Product[],
    [productsData]
  );
  const mediaBuyingProduct = React.useMemo(
    () => findMediaBuyingProduct(products),
    [products]
  );

  const productWithPlansQuery = trpc.products.getById.useQuery(
    { id: mediaBuyingProduct?.id ?? "", includePlans: true },
    { enabled: !!mediaBuyingProduct?.id, refetchOnWindowFocus: false }
  );
  const plans = React.useMemo(() => {
    const anyProduct = productWithPlansQuery.data as unknown as
      | (Product & { plans?: ProductPlan[] })
      | undefined;
    return anyProduct?.plans ?? [];
  }, [productWithPlansQuery.data]);
  const selectedPlan = React.useMemo(() => {
    if (!selectedPlanId) return null;
    return plans.find((p) => p.id === selectedPlanId) ?? null;
  }, [plans, selectedPlanId]);
  const commissionRatePercent = React.useMemo(
    () => pickCommissionRatePercent(selectedPlan),
    [selectedPlan]
  );

  const currencyConversion = useCurrencyConversion();
  const [kesPerUnitOverride, setKesPerUnitOverride] = React.useState<
    Record<string, string>
  >({});

  const getKesRateForCurrency = React.useCallback(
    (currency: string) => {
      const c = (currency || "KES").toUpperCase();
      if (c === "KES") return 1;
      const overrideRaw = kesPerUnitOverride[c];
      const override = overrideRaw != null ? Number(overrideRaw) : NaN;
      if (Number.isFinite(override) && override > 0) return override;
      return currencyConversion.getExchangeRate(c, "KES");
    },
    [kesPerUnitOverride, currencyConversion]
  );

  const metaAccountsQuery = trpc.metaAds.accounts.listAdAccounts.useQuery(
    undefined,
    { enabled: !!selectedPlanId, refetchOnWindowFocus: false, retry: 1 }
  );
  const metaAccountsPayload = (metaAccountsQuery.data as any)?.data;
  const metaAccounts = React.useMemo(
    () => (metaAccountsPayload ?? []) as any[],
    [metaAccountsPayload]
  );
  const metaAccountCurrencyById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of metaAccounts) {
      const id = String(acc.accountId ?? acc.id ?? "");
      if (!id) continue;
      map.set(id, pickAccountCurrency(acc));
    }
    return map;
  }, [metaAccounts]);
  const metaAccountNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of metaAccounts) {
      const id = String(acc.accountId ?? acc.id ?? "");
      const name = String(acc.accountName ?? acc.name ?? id) || id;
      if (id) map.set(id, name);
    }
    return map;
  }, [metaAccounts]);

  const googleAccountsQuery =
    trpc.googleAds.accounts.listAccessibleAccounts.useQuery(
      { forceRefresh: false },
      { enabled: !!selectedPlanId, refetchOnWindowFocus: false, retry: 1 }
    );
  const googleAccountsPayload = (googleAccountsQuery.data as any)?.data;
  const googleAccounts = React.useMemo(
    () => (googleAccountsPayload ?? []) as GoogleAdsAccount[],
    [googleAccountsPayload]
  );
  const googleAccountCurrencyById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of googleAccounts as any[]) {
      const id = String(acc.customerId ?? "");
      if (!id) continue;
      map.set(id, pickAccountCurrency(acc));
    }
    return map;
  }, [googleAccounts]);
  const googleAccountNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of googleAccounts) {
      const id = String(acc.customerId ?? "");
      const name = String(acc.accountName ?? id) || id;
      if (id) map.set(id, name);
    }
    return map;
  }, [googleAccounts]);

  const linkedInAccountsQuery = trpc.linkedInAds.accounts.listAdAccounts.useQuery(
    undefined,
    { enabled: !!selectedPlanId, refetchOnWindowFocus: false, retry: 1 }
  );
  const linkedInAccountsPayload = (linkedInAccountsQuery.data as any)?.data;
  const linkedInAccounts = React.useMemo(
    () => (linkedInAccountsPayload ?? []) as LinkedInAdsAccount[],
    [linkedInAccountsPayload]
  );
  const linkedInAccountCurrencyById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of linkedInAccounts as any[]) {
      const id = String(acc.id ?? "");
      if (!id) continue;
      map.set(id, pickAccountCurrency(acc));
    }
    return map;
  }, [linkedInAccounts]);
  const linkedInAccountNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of linkedInAccounts as any[]) {
      const id = String(acc.id ?? "");
      const name = String(acc.name ?? id) || id;
      if (id) map.set(id, name);
    }
    return map;
  }, [linkedInAccounts]);

  React.useEffect(() => {
    if (selectedPlanId) return;
    setSelectedMetaAccountIds([]);
    setSelectedGoogleCustomerIds([]);
    setSelectedLinkedInAccountIds([]);
    setSelectedMetaByAccount({});
    setSelectedGoogleByCustomer({});
    setSelectedLinkedInByAccount({});
    setMetaFeeInput("");
    setGoogleFeeInput("");
    setLinkedInFeeInput("");
    setMetaFeeCurrency("KES");
    setGoogleFeeCurrency("KES");
    setLinkedInFeeCurrency("KES");
    setInvoiceGenStatus("idle");
    setGeneratedByPlatform({});
    setQrStepDone(false);
  }, [selectedPlanId]);

  React.useEffect(() => {
    const keepMeta = new Set(selectedMetaAccountIds);
    setSelectedMetaByAccount((prev) => {
      const next: SelectedByParent = {};
      for (const [k, v] of Object.entries(prev)) if (keepMeta.has(k)) next[k] = v;
      return next;
    });
    const keepGoogle = new Set(selectedGoogleCustomerIds);
    setSelectedGoogleByCustomer((prev) => {
      const next: SelectedByParent = {};
      for (const [k, v] of Object.entries(prev))
        if (keepGoogle.has(k)) next[k] = v;
      return next;
    });
    const keepLinkedIn = new Set(selectedLinkedInAccountIds);
    setSelectedLinkedInByAccount((prev) => {
      const next: SelectedByParent = {};
      for (const [k, v] of Object.entries(prev))
        if (keepLinkedIn.has(k)) next[k] = v;
      return next;
    });
  }, [selectedMetaAccountIds, selectedGoogleCustomerIds, selectedLinkedInAccountIds]);

  const metaFeeRaw = React.useMemo(
    () => parseNumberOrZero(metaFeeInput),
    [metaFeeInput]
  );
  const googleFee = React.useMemo(
    () => parseNumberOrZero(googleFeeInput),
    [googleFeeInput]
  );
  const linkedInFee = React.useMemo(
    () => parseNumberOrZero(linkedInFeeInput),
    [linkedInFeeInput]
  );
  const googleFeeRaw = googleFee;
  const linkedInFeeRaw = linkedInFee;

  const metaFee = React.useMemo(
    () => metaFeeRaw * getKesRateForCurrency(metaFeeCurrency),
    [metaFeeRaw, metaFeeCurrency, getKesRateForCurrency]
  );
  const googleFeeKes = React.useMemo(
    () => googleFeeRaw * getKesRateForCurrency(googleFeeCurrency),
    [googleFeeRaw, googleFeeCurrency, getKesRateForCurrency]
  );
  const linkedInFeeKes = React.useMemo(
    () => linkedInFeeRaw * getKesRateForCurrency(linkedInFeeCurrency),
    [linkedInFeeRaw, linkedInFeeCurrency, getKesRateForCurrency]
  );

  const metaSpendTotal = React.useMemo(
    () => sumSelectedInKes(selectedMetaByAccount, getKesRateForCurrency),
    [selectedMetaByAccount, getKesRateForCurrency]
  );
  const googleSpendTotal = React.useMemo(
    () => sumSelectedInKes(selectedGoogleByCustomer, getKesRateForCurrency),
    [selectedGoogleByCustomer, getKesRateForCurrency]
  );
  const linkedInSpendTotal = React.useMemo(
    () => sumSelectedInKes(selectedLinkedInByAccount, getKesRateForCurrency),
    [selectedLinkedInByAccount, getKesRateForCurrency]
  );

  const metaInvoiceTotal = React.useMemo(
    () => (metaSpendTotal * commissionRatePercent) / 100 + metaFee,
    [metaSpendTotal, commissionRatePercent, metaFee]
  );
  const googleInvoiceTotal = React.useMemo(
    () => (googleSpendTotal * commissionRatePercent) / 100 + googleFeeKes,
    [googleSpendTotal, commissionRatePercent, googleFeeKes]
  );
  const linkedInInvoiceTotal = React.useMemo(
    () => (linkedInSpendTotal * commissionRatePercent) / 100 + linkedInFeeKes,
    [linkedInSpendTotal, commissionRatePercent, linkedInFeeKes]
  );

  const hasMeta = metaSpendTotal > 0;
  const hasGoogle = googleSpendTotal > 0;
  const hasLinkedIn = linkedInSpendTotal > 0;
  const hasAny = hasMeta || hasGoogle || hasLinkedIn;
  const grandTotal =
    (hasMeta ? metaInvoiceTotal : 0) +
    (hasGoogle ? googleInvoiceTotal : 0) +
    (hasLinkedIn ? linkedInInvoiceTotal : 0);

  const templateNodes: Node[] = React.useMemo(() => {
    const list: Node[] = [];

    const mergeInvoiceY =
      hasMeta || hasGoogle || hasLinkedIn
        ? (() => {
            const ys: number[] = [];
            if (hasMeta) ys.push(MB_Y.metaLane);
            if (hasGoogle) ys.push(mbYGoogleLane);
            if (hasLinkedIn) ys.push(mbYLinkedInLane);
            return (Math.min(...ys) + Math.max(...ys)) / 2;
          })()
        : MB_Y.metaLane + MB_Y.laneStep;

    list.push({
      id: "start",
      position: { x: MB_X.start, y: MB_Y.left },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      sourcePosition: "right",
      data: { label: "Started", flowRole: "start" },
    });

    const serviceStatus = productsQuery.isLoading
      ? "Loading products…"
      : productsQuery.isError
        ? `Failed: ${productsQuery.error?.message ?? "Unknown error"}`
        : mediaBuyingProduct
          ? `Found: ${mediaBuyingProduct.name} (${mediaBuyingProduct.serviceType})`
          : "Not found — flow ends here";

    list.push({
      id: "get-service",
      position: { x: MB_X.service, y: MB_Y.left },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      targetPosition: "left",
      sourcePosition: "right",
      data: {
        status: productsQuery.isError
          ? "error"
          : productsQuery.isLoading
            ? "loading"
            : mediaBuyingProduct
              ? "success"
              : "error",
        label: (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Get Service (Media Buying)</div>
            <div className="text-[11px] text-muted-foreground max-w-[280px]">
              {serviceStatus}
            </div>
          </div>
        ),
      },
    });

    if (!mediaBuyingProduct && !productsQuery.isLoading && !productsQuery.isError) {
      list.push({
        id: "end",
        position: { x: MB_X.endNoProduct, y: MB_Y.left },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        data: { label: <EndNode />, flowRole: "end" },
      });
      return list;
    }

    const plansStatus = productWithPlansQuery.isLoading
      ? "Loading plans…"
      : productWithPlansQuery.isError
        ? `Failed: ${productWithPlansQuery.error?.message ?? "Unknown error"}`
        : plans.length === 0
          ? "No plans found."
          : selectedPlan
            ? `Selected: ${selectedPlan.name}`
            : "Click a plan to continue.";

    list.push({
      id: "get-plans",
      position: { x: MB_X.plans, y: MB_Y.left },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      targetPosition: "left",
      sourcePosition: "right",
      data: {
        status: productWithPlansQuery.isError
          ? "error"
          : productWithPlansQuery.isLoading
            ? "loading"
            : plans.length > 0
              ? "success"
              : "error",
        label: (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">
                Get Plans{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  ({mediaBuyingProduct?.name ?? "—"})
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground max-w-[320px]">
                {plansStatus}
              </div>
            </div>
            {plans.length > 0 && (
              <div className="flex flex-col gap-1">
                {plans.map((p) => {
                  const selected = p.id === selectedPlanId;
                  const commission =
                    p.pricingModel === "COMMISSION" && p.commissionRate != null
                      ? Number(p.commissionRate)
                      : null;
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className="nodrag justify-start h-7 text-xs"
                      onClick={() => setSelectedPlanId(p.id)}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {p.pricingModel}
                        </Badge>
                        {commission != null && !Number.isNaN(commission) && (
                          <Badge variant="outline" className="text-[10px]">
                            {commission}%
                          </Badge>
                        )}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        ),
      },
    });

    if (!selectedPlanId) return list;

    list.push({
      id: "platforms",
      position: { x: MB_X.hub, y: MB_Y.hub },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      targetPosition: "left",
      sourcePosition: "right",
      data: {
        status: selectedPlanId ? "success" : "loading",
        label: (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Platforms</div>
            <div className="text-[11px] text-muted-foreground">
              Meta • Google Ads • LinkedIn
            </div>
          </div>
        ),
      },
    });

    list.push({
      id: "meta-accounts",
      position: { x: MB_X.accounts, y: MB_Y.metaLane },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      targetPosition: "left",
      sourcePosition: "right",
      data: {
        status: metaAccountsQuery.isError
          ? "error"
          : metaAccountsQuery.isLoading
            ? "loading"
            : "success",
        label: renderAccounts(
          "Meta",
          metaAccountsQuery,
          metaAccounts,
          selectedMetaAccountIds,
          setSelectedMetaAccountIds,
          async () => {
            await utils.metaAds.accounts.listAdAccounts.invalidate();
            await metaAccountsQuery.refetch();
          },
          metaAccountsQuery.isFetching
        ),
      },
    });

    list.push({
      id: "google-accounts",
      position: { x: MB_X.accounts, y: mbYGoogleLane },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      targetPosition: "left",
      sourcePosition: "right",
      data: {
        status: googleAccountsQuery.isError
          ? "error"
          : googleAccountsQuery.isLoading
            ? "loading"
            : "success",
        label: renderGoogleAccounts(
          googleAccountsQuery,
          googleAccounts,
          selectedGoogleCustomerIds,
          setSelectedGoogleCustomerIds,
          async () => {
            await utils.googleAds.accounts.listAccessibleAccounts.invalidate();
            await googleAccountsQuery.refetch();
          },
          googleAccountsQuery.isFetching
        ),
      },
    });

    list.push({
      id: "linkedin-accounts",
      position: { x: MB_X.accounts, y: mbYLinkedInLane },
      type: MEDIA_BUYING_EOM_NODE_TYPE,
      targetPosition: "left",
      sourcePosition: "right",
      data: {
        status: linkedInAccountsQuery.isError
          ? "error"
          : linkedInAccountsQuery.isLoading
            ? "loading"
            : "success",
        label: renderLinkedInAccounts(
          linkedInAccountsQuery,
          linkedInAccounts,
          selectedLinkedInAccountIds,
          setSelectedLinkedInAccountIds,
          async () => {
            await utils.linkedInAds.accounts.listAdAccounts.invalidate();
            await linkedInAccountsQuery.refetch();
          },
          linkedInAccountsQuery.isFetching
        ),
      },
    });

    selectedMetaAccountIds.forEach((accountId, idx) => {
      const selectedIds = Object.keys(selectedMetaByAccount[accountId] ?? {});
      const currency = metaAccountCurrencyById.get(accountId) ?? "KES";
      list.push({
        id: `meta-campaigns:${accountId}`,
        position: { x: MB_X.campaigns, y: MB_Y.metaLane + idx * MB_Y.stackGap },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <MetaCampaignsNode
              accountId={accountId}
              accountName={metaAccountNameById.get(accountId) ?? accountId}
              currency={currency}
              dateRange={metaDateRangeByAccount[accountId] ?? defaultLast30DaysRange()}
              setDateRange={(dr) =>
                setMetaDateRangeByAccount((prev) => ({ ...prev, [accountId]: dr }))
              }
              selectedIds={selectedIds}
              onToggle={(c: MetaCampaign, checked) => {
                setSelectedMetaByAccount((prev) => {
                  const byId = prev[accountId] ?? {};
                  const nextById = { ...byId };
                  if (checked) {
                    const spend = c.insights?.spend ? Number(c.insights.spend) : 0;
                    nextById[c.id] = {
                      id: c.id,
                      name: c.name ?? `Campaign ${c.id}`,
                      spend: Number.isFinite(spend) ? spend : 0,
                      currency,
                    };
                  } else {
                    delete nextById[c.id];
                  }
                  return { ...prev, [accountId]: nextById };
                });
              }}
            />
          ),
        },
      });

      if (currency !== "KES") {
        const rate = getKesRateForCurrency(currency);
        list.push({
          id: `meta-convert:${accountId}`,
          position: {
            x: (MB_X.campaigns + MB_X.fee) / 2,
            y: MB_Y.metaLane + idx * MB_Y.stackGap,
          },
          type: MEDIA_BUYING_EOM_NODE_TYPE,
          targetPosition: "left",
          sourcePosition: "right",
          data: {
            label: (
              <CurrencyConverterNode
                fromCurrency={currency}
                toCurrency="KES"
                rate={rate}
                rateOverride={kesPerUnitOverride[currency]}
                setRateOverride={(v) =>
                  setKesPerUnitOverride((prev) => ({
                    ...prev,
                    [currency]: v,
                  }))
                }
              />
            ),
          },
        });
      }
    });

    selectedGoogleCustomerIds.forEach((customerId, idx) => {
      const selectedIds = Object.keys(selectedGoogleByCustomer[customerId] ?? {});
      const currency = googleAccountCurrencyById.get(customerId) ?? "KES";
      list.push({
        id: `google-campaigns:${customerId}`,
        position: { x: MB_X.campaigns, y: mbYGoogleLane + idx * MB_Y.stackGap },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <GoogleCampaignsNode
              customerId={customerId}
              accountName={googleAccountNameById.get(customerId) ?? customerId}
              currency={currency}
              dateRange={googleDateRangeByCustomer[customerId] ?? defaultLast30DaysRange()}
              setDateRange={(dr) =>
                setGoogleDateRangeByCustomer((prev) => ({ ...prev, [customerId]: dr }))
              }
              selectedIds={selectedIds}
              onToggle={(c: GoogleCampaign, checked) => {
                setSelectedGoogleByCustomer((prev) => {
                  const byId = prev[customerId] ?? {};
                  const nextById = { ...byId };
                  if (checked) {
                    const spend = c.insights?.cost ? Number(c.insights.cost) : 0;
                    nextById[c.id] = {
                      id: c.id,
                      name: c.name ?? `Campaign ${c.id}`,
                      spend: Number.isFinite(spend) ? spend : 0,
                      currency,
                    };
                  } else {
                    delete nextById[c.id];
                  }
                  return { ...prev, [customerId]: nextById };
                });
              }}
            />
          ),
        },
      });

      if (currency !== "KES") {
        const rate = getKesRateForCurrency(currency);
        list.push({
          id: `google-convert:${customerId}`,
          position: {
            x: (MB_X.campaigns + MB_X.fee) / 2,
            y: mbYGoogleLane + idx * MB_Y.stackGap,
          },
          type: MEDIA_BUYING_EOM_NODE_TYPE,
          targetPosition: "left",
          sourcePosition: "right",
          data: {
            label: (
              <CurrencyConverterNode
                fromCurrency={currency}
                toCurrency="KES"
                rate={rate}
                rateOverride={kesPerUnitOverride[currency]}
                setRateOverride={(v) =>
                  setKesPerUnitOverride((prev) => ({
                    ...prev,
                    [currency]: v,
                  }))
                }
              />
            ),
          },
        });
      }
    });

    selectedLinkedInAccountIds.forEach((accountId, idx) => {
      const selectedIds = Object.keys(selectedLinkedInByAccount[accountId] ?? {});
      const currency = linkedInAccountCurrencyById.get(accountId) ?? "KES";
      list.push({
        id: `linkedin-groups:${accountId}`,
        position: { x: MB_X.campaigns, y: mbYLinkedInLane + idx * MB_Y.stackGap },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <LinkedInCampaignGroupsNode
              accountId={accountId}
              accountName={linkedInAccountNameById.get(accountId) ?? accountId}
              currency={currency}
              dateRange={linkedInDateRangeByAccount[accountId] ?? defaultLast30DaysRange()}
              setDateRange={(dr) =>
                setLinkedInDateRangeByAccount((prev) => ({ ...prev, [accountId]: dr }))
              }
              selectedIds={selectedIds}
              onToggle={(g: LinkedInCampaignGroup, checked) => {
                const gid = String(g.id);
                setSelectedLinkedInByAccount((prev) => {
                  const byId = prev[accountId] ?? {};
                  const nextById = { ...byId };
                  if (checked) {
                    const spendRaw = (g.insights as any)?.spend;
                    const spend = spendRaw != null ? Number(spendRaw) : 0;
                    nextById[gid] = {
                      id: gid,
                      name: g.name ?? `Group ${gid}`,
                      spend: Number.isFinite(spend) ? spend : 0,
                      currency,
                    };
                  } else {
                    delete nextById[gid];
                  }
                  return { ...prev, [accountId]: nextById };
                });
              }}
            />
          ),
        },
      });

      if (currency !== "KES") {
        const rate = getKesRateForCurrency(currency);
        list.push({
          id: `linkedin-convert:${accountId}`,
          position: {
            x: (MB_X.campaigns + MB_X.fee) / 2,
            y: mbYLinkedInLane + idx * MB_Y.stackGap,
          },
          type: MEDIA_BUYING_EOM_NODE_TYPE,
          targetPosition: "left",
          sourcePosition: "right",
          data: {
            label: (
              <CurrencyConverterNode
                fromCurrency={currency}
                toCurrency="KES"
                rate={rate}
                rateOverride={kesPerUnitOverride[currency]}
                setRateOverride={(v) =>
                  setKesPerUnitOverride((prev) => ({
                    ...prev,
                    [currency]: v,
                  }))
                }
              />
            ),
          },
        });
      }
    });

    if (hasMeta) {
      list.push({
        id: "meta-fee",
        position: { x: MB_X.fee, y: MB_Y.metaLane },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <FeeNode
              platformLabel="Meta"
              feeInput={metaFeeInput}
              setFeeInput={setMetaFeeInput}
              currency={metaFeeCurrency}
              setCurrency={setMetaFeeCurrency}
            />
          ),
        },
      });
      if (metaFeeCurrency !== "KES") {
        const rate = getKesRateForCurrency(metaFeeCurrency);
        list.push({
          id: "meta-fee-convert",
          position: { x: (MB_X.fee + MB_X.invoice) / 2, y: MB_Y.metaLane },
          type: MEDIA_BUYING_EOM_NODE_TYPE,
          targetPosition: "left",
          sourcePosition: "right",
          data: {
            label: (
              <CurrencyConverterNode
                fromCurrency={metaFeeCurrency}
                toCurrency="KES"
                rate={rate}
                rateOverride={kesPerUnitOverride[metaFeeCurrency]}
                setRateOverride={(v) =>
                  setKesPerUnitOverride((prev) => ({
                    ...prev,
                    [metaFeeCurrency]: v,
                  }))
                }
              />
            ),
          },
        });
      }
      list.push({
        id: "meta-invoice",
        position: { x: MB_X.invoice, y: MB_Y.metaLane },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <InvoicePreviewNode
              platformLabel="Meta"
              commissionRatePercent={commissionRatePercent}
              lines={flattenLinesKes(
                selectedMetaByAccount,
                (id) => metaAccountNameById.get(id) ?? id,
                getKesRateForCurrency
              )}
              fee={metaFee}
              selectedSpendTotal={metaSpendTotal}
              invoiceTotal={metaInvoiceTotal}
            />
          ),
        },
      });
    }

    if (hasGoogle) {
      list.push({
        id: "google-fee",
        position: { x: MB_X.fee, y: mbYGoogleLane },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <FeeNode
              platformLabel="Google"
              feeInput={googleFeeInput}
              setFeeInput={setGoogleFeeInput}
              currency={googleFeeCurrency}
              setCurrency={setGoogleFeeCurrency}
            />
          ),
        },
      });
      if (googleFeeCurrency !== "KES") {
        const rate = getKesRateForCurrency(googleFeeCurrency);
        list.push({
          id: "google-fee-convert",
          position: { x: (MB_X.fee + MB_X.invoice) / 2, y: mbYGoogleLane },
          type: MEDIA_BUYING_EOM_NODE_TYPE,
          targetPosition: "left",
          sourcePosition: "right",
          data: {
            label: (
              <CurrencyConverterNode
                fromCurrency={googleFeeCurrency}
                toCurrency="KES"
                rate={rate}
                rateOverride={kesPerUnitOverride[googleFeeCurrency]}
                setRateOverride={(v) =>
                  setKesPerUnitOverride((prev) => ({
                    ...prev,
                    [googleFeeCurrency]: v,
                  }))
                }
              />
            ),
          },
        });
      }
      list.push({
        id: "google-invoice",
        position: { x: MB_X.invoice, y: mbYGoogleLane },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <InvoicePreviewNode
              platformLabel="Google Ads"
              commissionRatePercent={commissionRatePercent}
              lines={flattenLinesKes(
                selectedGoogleByCustomer,
                (id) => googleAccountNameById.get(id) ?? id,
                getKesRateForCurrency
              )}
              fee={googleFee}
              selectedSpendTotal={googleSpendTotal}
              invoiceTotal={googleInvoiceTotal}
            />
          ),
        },
      });
    }

    if (hasLinkedIn) {
      list.push({
        id: "linkedin-fee",
        position: { x: MB_X.fee, y: mbYLinkedInLane },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <FeeNode
              platformLabel="LinkedIn"
              feeInput={linkedInFeeInput}
              setFeeInput={setLinkedInFeeInput}
              currency={linkedInFeeCurrency}
              setCurrency={setLinkedInFeeCurrency}
            />
          ),
        },
      });
      if (linkedInFeeCurrency !== "KES") {
        const rate = getKesRateForCurrency(linkedInFeeCurrency);
        list.push({
          id: "linkedin-fee-convert",
          position: { x: (MB_X.fee + MB_X.invoice) / 2, y: mbYLinkedInLane },
          type: MEDIA_BUYING_EOM_NODE_TYPE,
          targetPosition: "left",
          sourcePosition: "right",
          data: {
            label: (
              <CurrencyConverterNode
                fromCurrency={linkedInFeeCurrency}
                toCurrency="KES"
                rate={rate}
                rateOverride={kesPerUnitOverride[linkedInFeeCurrency]}
                setRateOverride={(v) =>
                  setKesPerUnitOverride((prev) => ({
                    ...prev,
                    [linkedInFeeCurrency]: v,
                  }))
                }
              />
            ),
          },
        });
      }
      list.push({
        id: "linkedin-invoice",
        position: { x: MB_X.invoice, y: mbYLinkedInLane },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <InvoicePreviewNode
              platformLabel="LinkedIn"
              commissionRatePercent={commissionRatePercent}
              lines={flattenLinesKes(
                selectedLinkedInByAccount,
                (id) => linkedInAccountNameById.get(id) ?? id,
                getKesRateForCurrency
              )}
              fee={linkedInFee}
              selectedSpendTotal={linkedInSpendTotal}
              invoiceTotal={linkedInInvoiceTotal}
            />
          ),
        },
      });
    }

    if (hasAny) {
      list.push({
        id: "invoice-from",
        position: { x: MB_X.invoiceFrom, y: mergeInvoiceY - 260 },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Invoice defaults (From)</div>
              <div className="text-[11px] text-muted-foreground max-w-[360px]">
                Prefilled defaults used for invoice creation. Edit as needed (logo is handled elsewhere).
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  className="nodrag h-7 text-xs"
                  placeholder="Your name"
                  value={invoiceDefaults.yourName}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourName: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs"
                  placeholder="Your email"
                  value={invoiceDefaults.yourEmail}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourEmail: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs col-span-2"
                  placeholder="Address"
                  value={invoiceDefaults.yourAddress}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourAddress: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs"
                  placeholder="City"
                  value={invoiceDefaults.yourCity}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourCity: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs"
                  placeholder="Country"
                  value={invoiceDefaults.yourCountry}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourCountry: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs"
                  placeholder="Tax ID"
                  value={invoiceDefaults.yourTaxId}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourTaxId: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs"
                  placeholder="ZIP"
                  value={invoiceDefaults.yourZip}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, yourZip: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  className="nodrag h-7 w-[110px] text-xs"
                  placeholder="Tax %"
                  value={invoiceDefaults.tax}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, tax: e.target.value }))
                  }
                />
                <Badge variant="outline" className="text-[10px]">
                  VAT
                </Badge>
                <Input
                  className="nodrag h-7 flex-1 text-xs"
                  placeholder="Invoice # (optional)"
                  value={invoiceDefaults.invoiceNo}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, invoiceNo: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  className="nodrag h-7 text-xs"
                  type="date"
                  value={invoiceDefaults.issueDate}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, issueDate: e.target.value }))
                  }
                />
                <Input
                  className="nodrag h-7 text-xs"
                  type="date"
                  value={invoiceDefaults.dueDate}
                  onChange={(e) =>
                    setInvoiceDefaults((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  Payment details are configured in the next step.
                </Badge>
              </div>
            </div>
          ),
        },
      });

      list.push({
        id: "invoice-payment",
        position: { x: MB_X.invoiceFrom, y: mergeInvoiceY + 260 },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Payment option</div>
              <div className="text-[11px] text-muted-foreground max-w-[360px]">
                Same options as invoice create. Default is bank. Edit fields as needed.
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={invoiceDefaults.paymentMethod}
                  onValueChange={(v) =>
                    setInvoiceDefaults((p) => ({ ...p, paymentMethod: v as any }))
                  }
                >
                  <SelectTrigger size="sm" className="nodrag h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="mpesa">MPESA</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-[10px]">
                  KES invoices
                </Badge>
              </div>

              {invoiceDefaults.paymentMethod === "bank" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input className="nodrag h-7 text-xs" placeholder="Bank name" value={invoiceDefaults.bankName} onChange={(e)=>setInvoiceDefaults(p=>({...p,bankName:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs" placeholder="Account number" value={invoiceDefaults.accountNumber} onChange={(e)=>setInvoiceDefaults(p=>({...p,accountNumber:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs col-span-2" placeholder="Account name" value={invoiceDefaults.accountName} onChange={(e)=>setInvoiceDefaults(p=>({...p,accountName:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs" placeholder="Branch name" value={invoiceDefaults.branchName} onChange={(e)=>setInvoiceDefaults(p=>({...p,branchName:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs" placeholder="Branch code" value={invoiceDefaults.branchCode} onChange={(e)=>setInvoiceDefaults(p=>({...p,branchCode:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs col-span-2" placeholder="Swift code" value={invoiceDefaults.swiftCode} onChange={(e)=>setInvoiceDefaults(p=>({...p,swiftCode:e.target.value}))}/>
                </div>
              )}

              {invoiceDefaults.paymentMethod === "mpesa" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input className="nodrag h-7 text-xs" placeholder="Paybill number" value={invoiceDefaults.mpesaPaybillNumber} onChange={(e)=>setInvoiceDefaults(p=>({...p,mpesaPaybillNumber:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs" placeholder="Account number" value={invoiceDefaults.mpesaAccountNumber} onChange={(e)=>setInvoiceDefaults(p=>({...p,mpesaAccountNumber:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs col-span-2" placeholder="Instructions" value={invoiceDefaults.mpesaInstructions} onChange={(e)=>setInvoiceDefaults(p=>({...p,mpesaInstructions:e.target.value}))}/>
                </div>
              )}

              {invoiceDefaults.paymentMethod === "cheque" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input className="nodrag h-7 text-xs col-span-2" placeholder="Delivery address" value={invoiceDefaults.chequeDeliveryAddress} onChange={(e)=>setInvoiceDefaults(p=>({...p,chequeDeliveryAddress:e.target.value}))}/>
                  <Input className="nodrag h-7 text-xs col-span-2" placeholder="Instructions" value={invoiceDefaults.chequeInstructions} onChange={(e)=>setInvoiceDefaults(p=>({...p,chequeInstructions:e.target.value}))}/>
                </div>
              )}
            </div>
          ),
        },
      });

      list.push({
        id: "invoice-billto",
        position: { x: MB_X.billTo, y: mergeInvoiceY - 50 },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Invoice “Bill To” (Team)</div>
              <div className="text-[11px] text-muted-foreground max-w-[360px]">
                Choose a team. Billing details are sourced from team billing settings.
              </div>

              <div className="flex items-center gap-2">
                <Popover open={teamPickerOpen} onOpenChange={setTeamPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={teamPickerOpen}
                    className="nodrag w-full justify-between h-7 text-xs"
                  >
                    {selectedTeam
                      ? selectedTeam.name
                      : teamsQuery.isLoading
                        ? "Loading teams…"
                        : "Select team"}
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search teams..." />
                    <CommandEmpty>
                      {teamsQuery.isLoading ? "Loading…" : "No teams found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {(teams ?? []).map((t: any) => (
                        <CommandItem
                          key={t.id}
                          value={t.id}
                          onSelect={() => {
                            setSelectedBillToTeamId(t.id);
                            setTeamPickerOpen(false);
                          }}
                        >
                          <span className="flex items-center justify-between w-full">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{t.slug}</p>
                            </div>
                            {t.id === selectedBillToTeamId ? (
                              <Check className="h-4 w-4 opacity-100" />
                            ) : (
                              <Check className="h-4 w-4 opacity-0" />
                            )}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="nodrag h-7 w-7"
                  onClick={() => teamsQuery.refetch()}
                  disabled={teamsQuery.isFetching}
                  title="Refresh teams"
                >
                  <RefreshCw className={teamsQuery.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                </Button>
              </div>

              {selectedBillToTeamId && !billingComplete && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-[11px] text-destructive">
                  Team billing settings are incomplete. Update them to continue.
                </div>
              )}

              <AlertDialog
                open={showBillingIncompleteDialog}
                onOpenChange={setShowBillingIncompleteDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Billing details incomplete</AlertDialogTitle>
                    <AlertDialogDescription>
                      The selected team does not have completed billing settings. Please update the billing information for this team before issuing invoices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={() => {
                        window.open("/agency/manage-teams", "_blank", "noopener,noreferrer");
                      }}
                    >
                      Manage teams
                    </AlertDialogAction>
                    <AlertDialogAction
                      onClick={() => setShowBillingIncompleteDialog(false)}
                    >
                      Close
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ),
        },
      });

      list.push({
        id: "invoice-qr",
        position: { x: MB_X.qr, y: mergeInvoiceY - 50 },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">QR Code (optional)</div>
              <div className="text-[11px] text-muted-foreground max-w-[360px]">
                If provided, it will be embedded in the invoice PDF. Otherwise you can skip.
              </div>
              <Input
                className="nodrag h-7 text-xs"
                placeholder="QR code value"
                value={invoiceDefaults.qrCodeValue}
                onChange={(e) =>
                  setInvoiceDefaults((p) => ({ ...p, qrCodeValue: e.target.value }))
                }
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="nodrag h-7 text-xs"
                  disabled={!invoiceDefaults.qrCodeValue}
                  onClick={() => setQrStepDone(true)}
                >
                  Submit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="nodrag h-7 text-xs"
                  onClick={() => {
                    setInvoiceDefaults((p) => ({ ...p, qrCodeValue: "" }));
                    setQrStepDone(true);
                  }}
                >
                  Skip
                </Button>
                {qrStepDone && (
                  <Badge variant="outline" className="text-[10px]">
                    Ready
                  </Badge>
                )}
              </div>
            </div>
          ),
        },
      });

      list.push({
        id: "generate-invoices",
        position: { x: MB_X.generate, y: mergeInvoiceY },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <GenerateInvoicesNode
              metaTotal={hasMeta ? metaInvoiceTotal : null}
              googleTotal={hasGoogle ? googleInvoiceTotal : null}
              linkedInTotal={hasLinkedIn ? linkedInInvoiceTotal : null}
              grandTotal={grandTotal}
              status={invoiceGenStatus}
              canGenerate={
                billingComplete &&
                Boolean(selectedBillToTeamId) &&
                qrStepDone &&
                invoiceGenStatus !== "generating"
              }
              onGenerate={async () => {
                try {
                  setInvoiceGenStatus("generating");
                  setGeneratedByPlatform({});

                  await registerMbEomFonts();

                  const taxRatePercent = Number(invoiceDefaults.tax || "16") || 0;

                  const fromDetails = {
                    name: invoiceDefaults.yourName,
                    email: invoiceDefaults.yourEmail,
                    address: invoiceDefaults.yourAddress,
                    city: invoiceDefaults.yourCity,
                    state: invoiceDefaults.yourState,
                    country: invoiceDefaults.yourCountry,
                    zip: invoiceDefaults.yourZip,
                    taxId: invoiceDefaults.yourTaxId,
                  };

                  const customerDetails = {
                    name: billingSettings?.legalName ?? selectedTeam?.name ?? "",
                    email: billingSettings?.billingEmail ?? "",
                    address: billingSettings?.addressLine1 ?? "",
                    city: billingSettings?.city ?? "",
                    state: billingSettings?.state ?? "",
                    country: billingSettings?.country ?? "",
                    zip: billingSettings?.postalCode ?? "",
                    taxId: billingSettings?.taxId ?? "",
                  };

                  const paymentDetailsJson: Record<string, unknown> = {
                    paymentMethod: invoiceDefaults.paymentMethod,
                    currency: "KES",
                  };
                  if (invoiceDefaults.paymentMethod === "bank") {
                    paymentDetailsJson.bankName = invoiceDefaults.bankName;
                    paymentDetailsJson.accountNumber = invoiceDefaults.accountNumber;
                    paymentDetailsJson.accountName = invoiceDefaults.accountName;
                    paymentDetailsJson.branchName = invoiceDefaults.branchName;
                    paymentDetailsJson.branchCode = invoiceDefaults.branchCode;
                    paymentDetailsJson.swiftCode = invoiceDefaults.swiftCode;
                  } else if (invoiceDefaults.paymentMethod === "mpesa") {
                    paymentDetailsJson.mpesaPaybillNumber = invoiceDefaults.mpesaPaybillNumber;
                    paymentDetailsJson.mpesaAccountNumber = invoiceDefaults.mpesaAccountNumber;
                    paymentDetailsJson.mpesaInstructions = invoiceDefaults.mpesaInstructions;
                  } else {
                    paymentDetailsJson.chequeDeliveryAddress =
                      invoiceDefaults.chequeDeliveryAddress;
                    paymentDetailsJson.chequeInstructions =
                      invoiceDefaults.chequeInstructions;
                  }
                  if (invoiceDefaults.qrCodeValue) {
                    paymentDetailsJson.qrCodeValue = invoiceDefaults.qrCodeValue;
                  }

                  let qrCodeDataUrl: string | undefined;
                  if (invoiceDefaults.qrCodeValue) {
                    try {
                      qrCodeDataUrl = await QRCodeUtil.toDataURL(invoiceDefaults.qrCodeValue, {
                        width: 120,
                        margin: 1,
                      });
                    } catch {
                      qrCodeDataUrl = undefined;
                    }
                  }

                  const buildPlatform = async (
                    platform: "meta" | "google" | "linkedin",
                    platformLabel: string,
                    lines: Array<{ id: string; name: string; context: string; spendKes: number }>,
                    feeKes: number,
                    dateRange: DateRange | undefined
                  ) => {
                    if (lines.length === 0) return;
                    const tr = toTimeRange(dateRange);
                    const rangeLabel =
                      tr?.since && tr?.until ? `${tr.since} – ${tr.until}` : "—";
                    const items = lines.map((l, idx) => {
                      const commissionAmountKes = (l.spendKes * commissionRatePercent) / 100;
                      return {
                        position: idx,
                        name: `Media Buying - ${selectedPlan?.name ?? "Commission Plan"} (${l.context} - ${l.name}, ${rangeLabel}, Total Ad spend - ${l.spendKes.toFixed(2)} KES - ${platformLabel})`,
                        description: null,
                        quantity: 1,
                        unit: null,
                        price: String(commissionAmountKes),
                        tax: null,
                        vat: null,
                        discount: null,
                        total: String(commissionAmountKes),
                        metadata: null,
                      };
                    });
                    const feeLine = {
                      position: items.length,
                      name: "Ad serving fee",
                      description: platformLabel,
                      quantity: 1,
                      unit: null,
                      price: String(feeKes),
                      tax: null,
                      vat: null,
                      discount: null,
                      total: String(feeKes),
                      metadata: null,
                    };
                    const lineItems = [...items, feeLine];
                    const subtotal = lineItems.reduce((s, it) => s + Number(it.total || 0), 0);
                    const discountValue = Number(invoiceDefaults.discount || "0") || 0;
                    const taxAmount = (subtotal - discountValue) * (taxRatePercent / 100);
                    const totalAmount = subtotal - discountValue + taxAmount;

                    const issueDate =
                      invoiceDefaults.issueDate ||
                      new Date().toISOString().slice(0, 10);
                    const dueDate =
                      invoiceDefaults.dueDate ||
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .slice(0, 10);
                    const invoiceNumber =
                      invoiceDefaults.invoiceNo ||
                      `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${platform.toUpperCase()}`;

                    const invoiceTerms = {
                      invoiceNumber,
                      issueDate,
                      dueDate,
                    };

                    const blob = await pdf(
                      <Document>
                        <Page size="A4" style={pdfContainers.page}>
                          <PdfDetails
                            yourDetails={{
                              yourName: invoiceDefaults.yourName,
                              yourAddress: invoiceDefaults.yourAddress,
                              yourCity: invoiceDefaults.yourCity,
                              yourState: invoiceDefaults.yourState,
                              yourCountry: invoiceDefaults.yourCountry,
                              yourLogo:
                                "https://1ris7itpac.ufs.sh/f/Djp547U8wumpWQzBihElLmSnxiqhFZB2ajbeTk0Y6XofJ4Mp",
                              yourEmail: invoiceDefaults.yourEmail,
                              yourTaxId: invoiceDefaults.yourTaxId,
                              yourZip: invoiceDefaults.yourZip,
                            }}
                            companyDetails={{
                              companyName: customerDetails.name,
                              companyAddress: customerDetails.address,
                              companyCity: customerDetails.city,
                              companyState: customerDetails.state,
                              companyCountry: customerDetails.country,
                              companyTaxId: customerDetails.taxId,
                              companyZip: customerDetails.zip,
                              email: customerDetails.email,
                            }}
                            invoiceDetails={{
                              note: invoiceDefaults.note,
                              discount: invoiceDefaults.discount,
                              taxRate: String(taxRatePercent),
                              items: lineItems.map((li) => ({
                                itemDescription: li.name,
                                amount: Number(li.price),
                                qty: li.quantity,
                              })),
                              currency: "KES",
                            }}
                            paymentDetails={{
                              ...(paymentDetailsJson as any),
                              qrCodeDataUrl,
                            }}
                            invoiceTerms={{
                              invoiceNumber: invoiceTerms.invoiceNumber,
                              issueDate: invoiceTerms.issueDate,
                              dueDate: invoiceTerms.dueDate,
                            }}
                          />
                        </Page>
                      </Document>
                    ).toBlob();

                    const pdfBase64 = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });

                    const saved = await submitInvoiceMutation.mutateAsync({
                      invoiceNumber: invoiceNumber || undefined,
                      customerName: customerDetails.name || undefined,
                      customerEmail: customerDetails.email,
                      issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
                      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                      amount: String(totalAmount),
                      subtotal: String(subtotal),
                      discount: invoiceDefaults.discount || undefined,
                      tax: String(taxAmount),
                      currency: "KES",
                      note: invoiceDefaults.note || undefined,
                      lineItems: lineItems as any,
                      fromDetails: fromDetails as any,
                      customerDetails: customerDetails as any,
                      paymentDetails: paymentDetailsJson as any,
                      pdfBase64,
                      billingEmail: customerDetails.email,
                    });

                    const invoiceId = saved?.id;
                    if (workflowRunId && invoiceId) {
                      try {
                        await linkInvoiceMutation.mutateAsync({
                          runId: workflowRunId,
                          platform,
                          invoiceId,
                        });
                      } catch {
                        /* non-fatal */
                      }
                      setGeneratedInvoiceIds((prev) => ({
                        ...prev,
                        [platform]: invoiceId,
                      }));
                    }

                    setGeneratedByPlatform((prev) => ({
                      ...prev,
                      [platform]: { pdfBase64 },
                    }));
                  };

                  const metaLines = flattenLinesKes(
                    selectedMetaByAccount,
                    (id) => metaAccountNameById.get(id) ?? id,
                    getKesRateForCurrency
                  ).map((l) => ({ id: l.id, name: l.name, context: l.context, spendKes: l.spendKes }));
                  const googleLines = flattenLinesKes(
                    selectedGoogleByCustomer,
                    (id) => googleAccountNameById.get(id) ?? id,
                    getKesRateForCurrency
                  ).map((l) => ({ id: l.id, name: l.name, context: l.context, spendKes: l.spendKes }));
                  const linkedInLines = flattenLinesKes(
                    selectedLinkedInByAccount,
                    (id) => linkedInAccountNameById.get(id) ?? id,
                    getKesRateForCurrency
                  ).map((l) => ({ id: l.id, name: l.name, context: l.context, spendKes: l.spendKes }));

                  if (hasMeta) {
                    const dr = metaDateRangeByAccount[selectedMetaAccountIds[0]] ?? defaultLast30DaysRange();
                    await buildPlatform("meta", "Meta", metaLines, metaFee, dr);
                  }
                  if (hasGoogle) {
                    const dr = googleDateRangeByCustomer[selectedGoogleCustomerIds[0]] ?? defaultLast30DaysRange();
                    await buildPlatform("google", "Google Ads", googleLines, googleFeeKes, dr);
                  }
                  if (hasLinkedIn) {
                    const dr = linkedInDateRangeByAccount[selectedLinkedInAccountIds[0]] ?? defaultLast30DaysRange();
                    await buildPlatform("linkedin", "LinkedIn", linkedInLines, linkedInFeeKes, dr);
                  }

                  setInvoiceGenStatus("generated");
                } catch (e) {
                  console.error(e);
                  setInvoiceGenStatus("error");
                }
              }}
            />
          ),
        },
      });

      list.push({
        id: "invoice-downloads",
        position: { x: MB_X.downloads, y: mergeInvoiceY },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        sourcePosition: "right",
        data: {
          label: (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Download invoices</div>
              <div className="text-[11px] text-muted-foreground max-w-[360px]">
                Download one-by-one to avoid browser multi-download issues.
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="nodrag h-7 text-xs justify-start"
                  disabled={!generatedByPlatform.meta && !generatedInvoiceIds.meta}
                  onClick={() => {
                    const b64 = generatedByPlatform.meta?.pdfBase64;
                    if (b64) {
                      const blob = base64ToBlob(b64);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "meta-invoice.pdf";
                      a.click();
                      URL.revokeObjectURL(url);
                      return;
                    }
                    if (generatedInvoiceIds.meta) {
                      navigate(`/agency/invoices/${generatedInvoiceIds.meta}`);
                    }
                  }}
                >
                  Download Meta
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="nodrag h-7 text-xs justify-start"
                  disabled={!generatedByPlatform.google && !generatedInvoiceIds.google}
                  onClick={() => {
                    const b64 = generatedByPlatform.google?.pdfBase64;
                    if (b64) {
                      const blob = base64ToBlob(b64);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "google-ads-invoice.pdf";
                      a.click();
                      URL.revokeObjectURL(url);
                      return;
                    }
                    if (generatedInvoiceIds.google) {
                      navigate(`/agency/invoices/${generatedInvoiceIds.google}`);
                    }
                  }}
                >
                  Download Google Ads
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="nodrag h-7 text-xs justify-start"
                  disabled={!generatedByPlatform.linkedin && !generatedInvoiceIds.linkedin}
                  onClick={() => {
                    const b64 = generatedByPlatform.linkedin?.pdfBase64;
                    if (b64) {
                      const blob = base64ToBlob(b64);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "linkedin-invoice.pdf";
                      a.click();
                      URL.revokeObjectURL(url);
                      return;
                    }
                    if (generatedInvoiceIds.linkedin) {
                      navigate(`/agency/invoices/${generatedInvoiceIds.linkedin}`);
                    }
                  }}
                >
                  Download LinkedIn
                </Button>
              </div>
            </div>
          ),
        },
      });

      list.push({
        id: "done",
        position: { x: MB_X.done, y: mergeInvoiceY },
        type: MEDIA_BUYING_EOM_NODE_TYPE,
        targetPosition: "left",
        data: { label: <EndNode />, flowRole: "end" },
      });
    }

    return list;
  }, [
    productsQuery.isLoading,
    productsQuery.isError,
    productsQuery.error?.message,
    mediaBuyingProduct,
    productWithPlansQuery.isLoading,
    productWithPlansQuery.isError,
    productWithPlansQuery.error?.message,
    plans,
    selectedPlan,
    selectedPlanId,
    metaAccountsQuery.data,
    metaAccountsQuery.isLoading,
    metaAccountsQuery.isError,
    metaAccountsQuery.error?.message,
    metaAccounts,
    googleAccountsQuery.data,
    googleAccountsQuery.isLoading,
    googleAccountsQuery.isError,
    googleAccountsQuery.error?.message,
    googleAccounts,
    linkedInAccountsQuery.data,
    linkedInAccountsQuery.isLoading,
    linkedInAccountsQuery.isError,
    linkedInAccountsQuery.error?.message,
    linkedInAccounts,
    selectedMetaAccountIds,
    selectedGoogleCustomerIds,
    selectedLinkedInAccountIds,
    selectedMetaByAccount,
    selectedGoogleByCustomer,
    selectedLinkedInByAccount,
    metaAccountCurrencyById,
    metaAccountNameById,
    googleAccountCurrencyById,
    googleAccountNameById,
    linkedInAccountCurrencyById,
    linkedInAccountNameById,
    commissionRatePercent,
    kesPerUnitOverride,
    getKesRateForCurrency,
    metaFeeCurrency,
    googleFeeCurrency,
    linkedInFeeCurrency,
    metaFeeInput,
    googleFeeInput,
    linkedInFeeInput,
    metaFee,
    googleFee,
    linkedInFee,
    metaSpendTotal,
    googleSpendTotal,
    linkedInSpendTotal,
    metaInvoiceTotal,
    googleInvoiceTotal,
    linkedInInvoiceTotal,
    hasMeta,
    hasGoogle,
    hasLinkedIn,
    hasAny,
    grandTotal,
    generatedByPlatform,
    generatedInvoiceIds,
    navigate,
    workflowRunId,
    linkInvoiceMutation,
  ]);

  const topologyKey = React.useMemo(
    () => templateNodes.map((n) => n.id).sort().join("\0"),
    [templateNodes]
  );

  const templateNodesRef = React.useRef(templateNodes);
  templateNodesRef.current = templateNodes;

  const draggedNodeIdsRef = React.useRef<Set<string>>(new Set());

  const [nodeDims, setNodeDims] = React.useState<
    Record<string, { width: number; height: number }>
  >({});
  const [nodePositions, setNodePositions] = React.useState<
    Record<string, { x: number; y: number }>
  >({});
  const [flowSelectedIds, setFlowSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [selectedEdgeIds, setSelectedEdgeIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const hydratedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!workflowRunId) {
      hydratedRef.current = true;
      return;
    }
    hydratedRef.current = false;
  }, [workflowRunId]);

  React.useLayoutEffect(() => {
    if (!workflowRunId) return;
    if (!hydrationReady) return;
    if (initialGraphState == null) {
      hydratedRef.current = true;
      return;
    }
    if (hydratedRef.current) return;
    const h = hydrateMediaBuyingFromGraph(initialGraphState, initialInvoiceIds);
    if (!h) {
      hydratedRef.current = true;
      return;
    }
    setSelectedPlanId(h.selectedPlanId);
    setSelectedMetaAccountIds(h.selectedMetaAccountIds);
    setSelectedGoogleCustomerIds(h.selectedGoogleCustomerIds);
    setSelectedLinkedInAccountIds(h.selectedLinkedInAccountIds);
    setSelectedMetaByAccount(h.selectedMetaByAccount);
    setSelectedGoogleByCustomer(h.selectedGoogleByCustomer);
    setSelectedLinkedInByAccount(h.selectedLinkedInByAccount);
    setMetaFeeInput(h.metaFeeInput);
    setGoogleFeeInput(h.googleFeeInput);
    setLinkedInFeeInput(h.linkedInFeeInput);
    setMetaFeeCurrency(h.metaFeeCurrency);
    setGoogleFeeCurrency(h.googleFeeCurrency);
    setLinkedInFeeCurrency(h.linkedInFeeCurrency);
    setInvoiceDefaults(h.invoiceDefaults);
    setSelectedBillToTeamId(h.selectedBillToTeamId);
    setQrStepDone(h.qrStepDone);
    setInvoiceGenStatus(h.invoiceGenStatus);
    setGeneratedInvoiceIds(h.generatedInvoiceIds);
    setMetaDateRangeByAccount(h.metaDateRangeByAccount);
    setGoogleDateRangeByCustomer(h.googleDateRangeByCustomer);
    setLinkedInDateRangeByAccount(h.linkedInDateRangeByAccount);
    setKesPerUnitOverride(h.kesPerUnitOverride);
    setNodeDims(h.nodeDims);
    setNodePositions(h.nodePositions);
    setSelectedEdgeIds(new Set(h.selectedEdgeIds));
    setFlowSelectedIds(new Set(h.flowSelectedIds));
    hydratedRef.current = true;
  }, [workflowRunId, hydrationReady, initialGraphState, initialInvoiceIds]);

  React.useEffect(() => {
    const t = templateNodesRef.current;
    const ids = new Set(t.map((n) => n.id));
    setNodeDims((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setNodePositions((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    for (const id of [...draggedNodeIdsRef.current]) {
      if (!ids.has(id)) draggedNodeIdsRef.current.delete(id);
    }
    setFlowSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)));
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) return prev;
      return next;
    });
    setSelectedEdgeIds((prev) => {
      if (prev.size === 0) return prev;
      return new Set(); // reset on topology changes
    });
  }, [topologyKey]);

  const nodes: Node[] = React.useMemo(
    () =>
      templateNodes.map((n) => {
        const pos = nodePositions[n.id];
        return {
          ...n,
          position: pos ?? n.position,
          selected: flowSelectedIds.has(n.id),
          ...(nodeDims[n.id]
            ? { width: nodeDims[n.id].width, height: nodeDims[n.id].height }
            : {}),
        };
      }),
    [templateNodes, nodeDims, nodePositions, flowSelectedIds]
  );

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
    setNodePositions((prev) => {
      let next = prev;
      let touched = false;
      for (const c of changes) {
        if (
          c.type === "position" &&
          "id" in c &&
          "position" in c &&
          c.position != null
        ) {
          // React Flow may omit `dragging` depending on the change source.
          // If we receive a position change, treat it as initialized for controlled dragging.
          if (!("dragging" in c) || c.dragging !== false) {
            draggedNodeIdsRef.current.add(c.id);
          }
          const p = c.position as { x: number; y: number };
          const cur = prev[c.id];
          if (
            cur &&
            Math.abs(cur.x - p.x) < 0.5 &&
            Math.abs(cur.y - p.y) < 0.5
          ) {
            continue;
          }
          if (!touched) {
            next = { ...prev };
            touched = true;
          }
          next[c.id] = { x: p.x, y: p.y };
        }
      }
      return touched ? next : prev;
    });
    setNodeDims((prev) => {
      let next = prev;
      let touched = false;
      for (const c of changes) {
        if (
          c.type === "dimensions" &&
          "id" in c &&
          "dimensions" in c &&
          c.dimensions
        ) {
          const w = c.dimensions.width;
          const h = c.dimensions.height;
          const cur = prev[c.id];
          if (
            cur &&
            Math.abs(cur.width - w) < 0.5 &&
            Math.abs(cur.height - h) < 0.5
          ) {
            continue;
          }
          if (!touched) {
            next = { ...prev };
            touched = true;
          }
          next[c.id] = { width: w, height: h };
        }
      }
      return touched ? next : prev;
    });
    setFlowSelectedIds((prev) => {
      let next = prev;
      let touched = false;
      for (const c of changes) {
        if (c.type === "select" && "id" in c) {
          if (!touched) {
            next = new Set(prev);
            touched = true;
          }
          if (c.selected) next.add(c.id);
          else next.delete(c.id);
        }
      }
      return touched ? next : prev;
    });
  }, []);

  const onEdgesChange = React.useCallback((changes: EdgeChange[]) => {
    // Exclusive edge selection: selecting one edge unselects the previous one.
    let selectedId: string | null = null;
    let sawDeselection = false;
    for (const c of changes) {
      if (c.type === "select" && "id" in c) {
        if (c.selected) selectedId = c.id;
        else sawDeselection = true;
      }
    }
    if (selectedId) {
      setSelectedEdgeIds(new Set([selectedId]));
      return;
    }
    if (sawDeselection) setSelectedEdgeIds(new Set());
  }, []);

  const onNodeDragStart = React.useCallback(
    (_: React.MouseEvent, node: Node) => {
      draggedNodeIdsRef.current.add(node.id);
    },
    []
  );

  const edges: Edge[] = React.useMemo(() => {
    const e: Edge[] = [];
    const styleFor = (status: FlowStatus, id: string) => {
      const base = {
        stroke: edgeStrokeForStatus(status),
        strokeWidth: 2,
      } as React.CSSProperties;
      if (selectedEdgeIds.has(id)) {
        return {
          ...base,
          stroke: "url(#mb-eom-edge-gradient)",
          strokeWidth: 4,
        } as React.CSSProperties;
      }
      return base;
    };

    const serviceStatus: FlowStatus = productsQuery.isError
      ? "error"
      : productsQuery.isLoading
        ? "loading"
        : mediaBuyingProduct
          ? "success"
          : "error";

    const plansStatus: FlowStatus = productWithPlansQuery.isError
      ? "error"
      : productWithPlansQuery.isLoading
        ? "loading"
        : plans.length > 0
          ? "success"
          : "error";

    e.push({
      id: "e-start-service",
      source: "start",
      target: "get-service",
      type: "mb-eom",
      style: styleFor(serviceStatus, "e-start-service"),
    });

    if (templateNodes.some((n) => n.id === "end")) {
      e.push({
        id: "e-service-end",
        source: "get-service",
        target: "end",
        type: "mb-eom",
        style: styleFor(serviceStatus, "e-service-end"),
      });
      return e;
    }

    e.push({
      id: "e-service-plans",
      source: "get-service",
      target: "get-plans",
      type: "mb-eom",
      style: styleFor(serviceStatus, "e-service-plans"),
    });
    if (!selectedPlanId) return e;

    e.push({
      id: "e-plans-platforms",
      source: "get-plans",
      target: "platforms",
      type: "mb-eom",
      style: styleFor(plansStatus, "e-plans-platforms"),
    });
    e.push({
      id: "e-platforms-meta",
      source: "platforms",
      target: "meta-accounts",
      type: "mb-eom",
      style: styleFor(
        metaAccountsQuery.isError ? "error" : metaAccountsQuery.isLoading ? "loading" : "success",
        "e-platforms-meta"
      ),
    });
    e.push({
      id: "e-platforms-google",
      source: "platforms",
      target: "google-accounts",
      type: "mb-eom",
      style: styleFor(
        googleAccountsQuery.isError ? "error" : googleAccountsQuery.isLoading ? "loading" : "success",
        "e-platforms-google"
      ),
    });
    e.push({
      id: "e-platforms-linkedin",
      source: "platforms",
      target: "linkedin-accounts",
      type: "mb-eom",
      style: styleFor(
        linkedInAccountsQuery.isError ? "error" : linkedInAccountsQuery.isLoading ? "loading" : "success",
        "e-platforms-linkedin"
      ),
    });

    for (const id of selectedMetaAccountIds) {
      const currency = metaAccountCurrencyById.get(id) ?? "KES";
      e.push({
        id: `e-meta-accounts-campaigns:${id}`,
        source: "meta-accounts",
        target: `meta-campaigns:${id}`,
        type: "mb-eom",
        style: styleFor("success", `e-meta-accounts-campaigns:${id}`),
      });
      if (currency !== "KES") {
        e.push({
          id: `e-meta-campaigns-convert:${id}`,
          source: `meta-campaigns:${id}`,
          target: `meta-convert:${id}`,
          type: "mb-eom",
          style: styleFor("loading", `e-meta-campaigns-convert:${id}`),
        });
        e.push({
          id: `e-meta-convert-fee:${id}`,
          source: `meta-convert:${id}`,
          target: "meta-fee",
          type: "mb-eom",
          style: styleFor("loading", `e-meta-convert-fee:${id}`),
        });
      } else {
        e.push({
          id: `e-meta-campaigns-fee:${id}`,
          source: `meta-campaigns:${id}`,
          target: "meta-fee",
          type: "mb-eom",
          style: styleFor("success", `e-meta-campaigns-fee:${id}`),
        });
      }
    }
    for (const id of selectedGoogleCustomerIds) {
      const currency = googleAccountCurrencyById.get(id) ?? "KES";
      e.push({
        id: `e-google-accounts-campaigns:${id}`,
        source: "google-accounts",
        target: `google-campaigns:${id}`,
        type: "mb-eom",
        style: styleFor("success", `e-google-accounts-campaigns:${id}`),
      });
      if (currency !== "KES") {
        e.push({
          id: `e-google-campaigns-convert:${id}`,
          source: `google-campaigns:${id}`,
          target: `google-convert:${id}`,
          type: "mb-eom",
          style: styleFor("loading", `e-google-campaigns-convert:${id}`),
        });
        e.push({
          id: `e-google-convert-fee:${id}`,
          source: `google-convert:${id}`,
          target: "google-fee",
          type: "mb-eom",
          style: styleFor("loading", `e-google-convert-fee:${id}`),
        });
      } else {
        e.push({
          id: `e-google-campaigns-fee:${id}`,
          source: `google-campaigns:${id}`,
          target: "google-fee",
          type: "mb-eom",
          style: styleFor("success", `e-google-campaigns-fee:${id}`),
        });
      }
    }
    for (const id of selectedLinkedInAccountIds) {
      const currency = linkedInAccountCurrencyById.get(id) ?? "KES";
      e.push({
        id: `e-linkedin-accounts-groups:${id}`,
        source: "linkedin-accounts",
        target: `linkedin-groups:${id}`,
        type: "mb-eom",
        style: styleFor("success", `e-linkedin-accounts-groups:${id}`),
      });
      if (currency !== "KES") {
        e.push({
          id: `e-linkedin-groups-convert:${id}`,
          source: `linkedin-groups:${id}`,
          target: `linkedin-convert:${id}`,
          type: "mb-eom",
          style: styleFor("loading", `e-linkedin-groups-convert:${id}`),
        });
        e.push({
          id: `e-linkedin-convert-fee:${id}`,
          source: `linkedin-convert:${id}`,
          target: "linkedin-fee",
          type: "mb-eom",
          style: styleFor("loading", `e-linkedin-convert-fee:${id}`),
        });
      } else {
        e.push({
          id: `e-linkedin-groups-fee:${id}`,
          source: `linkedin-groups:${id}`,
          target: "linkedin-fee",
          type: "mb-eom",
          style: styleFor("success", `e-linkedin-groups-fee:${id}`),
        });
      }
    }

    if (hasMeta) {
      if (metaFeeCurrency !== "KES") {
        e.push({
          id: "e-meta-fee-convert",
          source: "meta-fee",
          target: "meta-fee-convert",
          type: "mb-eom",
          style: styleFor("loading", "e-meta-fee-convert"),
        });
        e.push({
          id: "e-meta-convert-invoice",
          source: "meta-fee-convert",
          target: "meta-invoice",
          type: "mb-eom",
          style: styleFor("loading", "e-meta-convert-invoice"),
        });
      } else {
        e.push({
          id: "e-meta-fee-invoice",
          source: "meta-fee",
          target: "meta-invoice",
          type: "mb-eom",
          style: styleFor("success", "e-meta-fee-invoice"),
        });
      }
    }
    if (hasGoogle) {
      if (googleFeeCurrency !== "KES") {
        e.push({
          id: "e-google-fee-convert",
          source: "google-fee",
          target: "google-fee-convert",
          type: "mb-eom",
          style: styleFor("loading", "e-google-fee-convert"),
        });
        e.push({
          id: "e-google-convert-invoice",
          source: "google-fee-convert",
          target: "google-invoice",
          type: "mb-eom",
          style: styleFor("loading", "e-google-convert-invoice"),
        });
      } else {
        e.push({
          id: "e-google-fee-invoice",
          source: "google-fee",
          target: "google-invoice",
          type: "mb-eom",
          style: styleFor("success", "e-google-fee-invoice"),
        });
      }
    }
    if (hasLinkedIn) {
      if (linkedInFeeCurrency !== "KES") {
        e.push({
          id: "e-linkedin-fee-convert",
          source: "linkedin-fee",
          target: "linkedin-fee-convert",
          type: "mb-eom",
          style: styleFor("loading", "e-linkedin-fee-convert"),
        });
        e.push({
          id: "e-linkedin-convert-invoice",
          source: "linkedin-fee-convert",
          target: "linkedin-invoice",
          type: "mb-eom",
          style: styleFor("loading", "e-linkedin-convert-invoice"),
        });
      } else {
        e.push({
          id: "e-linkedin-fee-invoice",
          source: "linkedin-fee",
          target: "linkedin-invoice",
          type: "mb-eom",
          style: styleFor("success", "e-linkedin-fee-invoice"),
        });
      }
    }

    if (hasAny) {
      if (hasMeta)
        e.push({
          id: "e-meta-invoice-generate",
          source: "meta-invoice",
          target: "invoice-from",
          type: "mb-eom",
          style: styleFor("success", "e-meta-invoice-generate"),
        });
      if (hasGoogle)
        e.push({
          id: "e-google-invoice-generate",
          source: "google-invoice",
          target: "invoice-from",
          type: "mb-eom",
          style: styleFor("success", "e-google-invoice-generate"),
        });
      if (hasLinkedIn)
        e.push({
          id: "e-linkedin-invoice-generate",
          source: "linkedin-invoice",
          target: "invoice-from",
          type: "mb-eom",
          style: styleFor("success", "e-linkedin-invoice-generate"),
        });
      e.push({
        id: "e-from-billto",
        source: "invoice-from",
        target: "invoice-billto",
        type: "mb-eom",
        style: styleFor("loading", "e-from-billto"),
      });
      e.push({
        id: "e-billto-qr",
        source: "invoice-billto",
        target: "invoice-qr",
        type: "mb-eom",
        style: styleFor("loading", "e-billto-qr"),
      });
      e.push({
        id: "e-qr-generate",
        source: "invoice-qr",
        target: "generate-invoices",
        type: "mb-eom",
        style: styleFor("loading", "e-qr-generate"),
      });
      e.push({
        id: "e-generate-downloads",
        source: "generate-invoices",
        target: "invoice-downloads",
        type: "mb-eom",
        style: styleFor("loading", "e-generate-downloads"),
      });
      e.push({
        id: "e-downloads-done",
        source: "invoice-downloads",
        target: "done",
        type: "mb-eom",
        style: styleFor("loading", "e-downloads-done"),
      });
    }
    // React Flow edge components receive `selected` from the edge object,
    // so we explicitly derive it from our exclusive-selection state.
    return e.map((edge) => ({
      ...edge,
      selected: selectedEdgeIds.has(edge.id),
    }));
  }, [
    templateNodes,
    selectedPlanId,
    selectedMetaAccountIds,
    selectedGoogleCustomerIds,
    selectedLinkedInAccountIds,
    metaAccountCurrencyById,
    googleAccountCurrencyById,
    linkedInAccountCurrencyById,
    metaFeeCurrency,
    googleFeeCurrency,
    linkedInFeeCurrency,
    productsQuery.isLoading,
    productsQuery.isError,
    mediaBuyingProduct,
    productWithPlansQuery.isLoading,
    productWithPlansQuery.isError,
    plans.length,
    metaAccountsQuery.isLoading,
    metaAccountsQuery.isError,
    googleAccountsQuery.isLoading,
    googleAccountsQuery.isError,
    linkedInAccountsQuery.isLoading,
    linkedInAccountsQuery.isError,
    selectedEdgeIds,
    hasMeta,
    hasGoogle,
    hasLinkedIn,
    hasAny,
  ]);

  const persistSnapshotJson = React.useMemo(
    () =>
      JSON.stringify(
        buildMediaBuyingGraphPayload({
          selectedPlanId,
          selectedMetaAccountIds,
          selectedGoogleCustomerIds,
          selectedLinkedInAccountIds,
          selectedMetaByAccount,
          selectedGoogleByCustomer,
          selectedLinkedInByAccount,
          metaFeeInput,
          googleFeeInput,
          linkedInFeeInput,
          metaFeeCurrency,
          googleFeeCurrency,
          linkedInFeeCurrency,
          invoiceDefaults,
          selectedBillToTeamId,
          qrStepDone,
          invoiceGenStatus,
          generatedInvoiceIds,
          metaDateRangeByAccount,
          googleDateRangeByCustomer,
          linkedInDateRangeByAccount,
          kesPerUnitOverride,
          nodeDims,
          nodePositions,
          selectedEdgeIds: [...selectedEdgeIds],
          flowSelectedIds: [...flowSelectedIds],
        })
      ),
    [
      selectedPlanId,
      selectedMetaAccountIds,
      selectedGoogleCustomerIds,
      selectedLinkedInAccountIds,
      selectedMetaByAccount,
      selectedGoogleByCustomer,
      selectedLinkedInByAccount,
      metaFeeInput,
      googleFeeInput,
      linkedInFeeInput,
      metaFeeCurrency,
      googleFeeCurrency,
      linkedInFeeCurrency,
      invoiceDefaults,
      selectedBillToTeamId,
      qrStepDone,
      invoiceGenStatus,
      generatedInvoiceIds,
      metaDateRangeByAccount,
      googleDateRangeByCustomer,
      linkedInDateRangeByAccount,
      kesPerUnitOverride,
      nodeDims,
      nodePositions,
      selectedEdgeIds,
      flowSelectedIds,
    ]
  );

  const saveGraphMutRef = React.useRef(saveGraphMutation);
  saveGraphMutRef.current = saveGraphMutation;

  /** Serialize graph saves so two debounced flushes never send the same version concurrently. */
  const graphSaveChainRef = React.useRef(Promise.resolve());

  const debouncedSaveGraph = React.useMemo(
    () =>
      debounce((runId: string, json: string) => {
        const graphStateJson = JSON.parse(json) as Record<string, unknown>;
        graphSaveChainRef.current = graphSaveChainRef.current
          .then(async () => {
            let version = persistVersionRef.current;
            try {
              const out = await saveGraphMutRef.current.mutateAsync({
                id: runId,
                version,
                graphStateJson,
              });
              persistVersionRef.current = out.version;
              setPersistVersion(out.version);
            } catch (err: unknown) {
              const code = (err as { data?: { code?: string } })?.data?.code;
              if (code === "CONFLICT" && runId) {
                try {
                  const fresh = await persistUtilsRef.current.cronWorkflowRun.getById.fetch({
                    id: runId,
                  });
                  version = fresh.version;
                  persistVersionRef.current = version;
                  setPersistVersion(version);
                  const out = await saveGraphMutRef.current.mutateAsync({
                    id: runId,
                    version,
                    graphStateJson,
                  });
                  persistVersionRef.current = out.version;
                  setPersistVersion(out.version);
                } catch {
                  toast.error("Could not save workflow. Reload the page.");
                }
              }
            }
          })
          .catch(() => {});
      }, 1000),
    []
  );

  React.useEffect(() => {
    if (!workflowRunId || !hydratedRef.current) return;
    debouncedSaveGraph(workflowRunId, persistSnapshotJson);
    return () => debouncedSaveGraph.cancel();
  }, [workflowRunId, persistSnapshotJson, debouncedSaveGraph]);

  const seenEdgeIdsRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    seenEdgeIdsRef.current = new Set();
  }, [workflowRunId]);

  React.useEffect(() => {
    if (!workflowRunId || !hydratedRef.current) return;
    for (const e of edges) {
      if (seenEdgeIdsRef.current.has(e.id)) continue;
      seenEdgeIdsRef.current.add(e.id);
      recordEdgeSnapshotMutation.mutate({
        runId: workflowRunId,
        edgeId: e.id,
        sourceNodeId: String(e.source),
        targetNodeId: String(e.target),
        payload: {
          edgeId: e.id,
          source: e.source,
          target: e.target,
        },
      });
    }
  }, [workflowRunId, edges, recordEdgeSnapshotMutation]);

  const edgeTypes = React.useMemo(
    () => ({
      "mb-eom": MediaBuyingEomFlowEdge,
    }),
    []
  );

  return (
    <div className="h-[78vh] min-h-[720px] w-full overflow-hidden rounded-lg border bg-card shadow-sm">
      <ReactFlow
        className="media-buying-eom-rf"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        nodeTypes={mediaBuyingEomNodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.15 }}
        minZoom={0.08}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: EDGE_TYPE,
          style: { strokeWidth: 2 },
          markerEnd: "url(#mb-eom-edge-circle)",
        }}
        nodesDraggable
        edgesFocusable
        nodesConnectable={false}
        elementsSelectable
        selectNodesOnDrag={false}
        elevateNodesOnSelect
      >
        <svg>
          <defs>
            <linearGradient id="mb-eom-edge-gradient">
              <stop offset="0%" stopColor="#e92a67" />
              <stop offset="50%" stopColor="#a853ba" />
              <stop offset="100%" stopColor="#2a8af6" />
            </linearGradient>

            <marker
              id="mb-eom-edge-circle"
              viewBox="-5 -5 10 10"
              refX="0"
              refY="0"
              markerUnits="strokeWidth"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <circle
                stroke="url(#mb-eom-edge-gradient)"
                strokeOpacity="0.9"
                r="2"
                cx="0"
                cy="0"
                fill="none"
              />
            </marker>
          </defs>
        </svg>
        <Background
          id="mb-eom-bg"
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.15}
          color="var(--muted-foreground)"
          className="opacity-[0.35] dark:opacity-25"
        />
        <MiniMap zoomable pannable className="!border-border !bg-card" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function renderAccounts(
  label: string,
  query: { isLoading: boolean; isError: boolean; error?: any },
  accounts: any[],
  selectedIds: string[],
  setSelected: (ids: string[]) => void,
  onRefresh?: () => void,
  isRefreshing?: boolean
) {
  const statusLine = query.isLoading
    ? `Loading ${label} accounts…`
    : query.isError
      ? `Failed: ${query.error?.message ?? "Unknown error"}`
      : accounts.length === 0
        ? `No accessible ${label} accounts found.`
        : `${accounts.length} account(s) found. Select one or more.`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{label}: Ad Accounts</div>
        {onRefresh && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="nodrag h-7 w-7"
            onClick={onRefresh}
            disabled={isRefreshing}
            title={`Refresh ${label} accounts`}
          >
            <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </Button>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground max-w-[320px]">
        {statusLine}
      </div>

      {accounts.length > 0 && (
        <div className="nowheel flex max-h-[160px] flex-col gap-1 overflow-auto pr-1">
          {accounts.map((acc: any) => {
            const id = String(acc.accountId ?? acc.id ?? "");
            const name = String(acc.accountName ?? acc.name ?? id) || id;
            const checked = selectedIds.includes(id);
            return (
              <label
                key={id}
                className="nodrag flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const isChecked = v === true;
                    if (isChecked)
                      setSelected(checked ? selectedIds : [...selectedIds, id]);
                    else setSelected(selectedIds.filter((x) => x !== id));
                  }}
                />
                <span className="text-xs truncate">{name}</span>
                <span className="ml-auto text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">
                  {id}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderGoogleAccounts(
  query: { isLoading: boolean; isError: boolean; error?: any },
  accounts: GoogleAdsAccount[],
  selectedIds: string[],
  setSelected: (ids: string[]) => void,
  onRefresh?: () => void,
  isRefreshing?: boolean
) {
  const statusLine = query.isLoading
    ? "Loading Google Ads accounts…"
    : query.isError
      ? `Failed: ${query.error?.message ?? "Unknown error"}`
      : accounts.length === 0
        ? "No accessible Google Ads accounts found."
        : `${accounts.length} account(s) found. Select one or more.`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Google Ads: Ad Accounts</div>
        {onRefresh && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="nodrag h-7 w-7"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Google Ads accounts"
          >
            <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </Button>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground max-w-[320px]">
        {statusLine}
      </div>
      {accounts.length > 0 && (
        <div className="nowheel flex max-h-[160px] flex-col gap-1 overflow-auto pr-1">
          {accounts.map((acc) => {
            const id = String(acc.customerId ?? "");
            const name = String(acc.accountName ?? id) || id;
            const checked = selectedIds.includes(id);
            return (
              <label
                key={id}
                className="nodrag flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const isChecked = v === true;
                    if (isChecked)
                      setSelected(checked ? selectedIds : [...selectedIds, id]);
                    else setSelected(selectedIds.filter((x) => x !== id));
                  }}
                />
                <span className="text-xs truncate">{name}</span>
                <span className="ml-auto text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">
                  {id}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderLinkedInAccounts(
  query: { isLoading: boolean; isError: boolean; error?: any },
  accounts: LinkedInAdsAccount[],
  selectedIds: string[],
  setSelected: (ids: string[]) => void,
  onRefresh?: () => void,
  isRefreshing?: boolean
) {
  const statusLine = query.isLoading
    ? "Loading LinkedIn ad accounts…"
    : query.isError
      ? `Failed: ${query.error?.message ?? "Unknown error"}`
      : accounts.length === 0
        ? "No accessible LinkedIn ad accounts found."
        : `${accounts.length} account(s) found. Select one or more.`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">LinkedIn: Ad Accounts</div>
        {onRefresh && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="nodrag h-7 w-7"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh LinkedIn accounts"
          >
            <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </Button>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground max-w-[320px]">
        {statusLine}
      </div>
      {accounts.length > 0 && (
        <div className="nowheel flex max-h-[160px] flex-col gap-1 overflow-auto pr-1">
          {accounts.map((acc) => {
            const id = String(acc.id ?? "");
            const name = String(acc.name ?? id) || id;
            const checked = selectedIds.includes(id);
            return (
              <label
                key={id}
                className="nodrag flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    const isChecked = v === true;
                    if (isChecked)
                      setSelected(checked ? selectedIds : [...selectedIds, id]);
                    else setSelected(selectedIds.filter((x) => x !== id));
                  }}
                />
                <span className="text-xs truncate">{name}</span>
                <span className="ml-auto text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">
                  {id}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
