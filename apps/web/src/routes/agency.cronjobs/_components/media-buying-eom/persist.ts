import type { DateRange } from "react-day-picker";
import type { InvoiceDefaults } from "./persist-types";

export const MEDIA_BUYING_GRAPH_V = 1 as const;

export type SelectedByParent = Record<
  string,
  Record<string, { id: string; name: string; spend: number; currency: string }>
>;

/** Serializable subset of media buying flow state stored in `cron_workflow_run.graph_state_json`. */
export type MediaBuyingGraphPayload = {
  v: typeof MEDIA_BUYING_GRAPH_V;
  selectedPlanId: string | null;
  selectedMetaAccountIds: string[];
  selectedGoogleCustomerIds: string[];
  selectedLinkedInAccountIds: string[];
  selectedMetaByAccount: SelectedByParent;
  selectedGoogleByCustomer: SelectedByParent;
  selectedLinkedInByAccount: SelectedByParent;
  metaFeeInput: string;
  googleFeeInput: string;
  linkedInFeeInput: string;
  metaFeeCurrency: string;
  googleFeeCurrency: string;
  linkedInFeeCurrency: string;
  invoiceDefaults: InvoiceDefaults;
  selectedBillToTeamId: string;
  qrStepDone: boolean;
  invoiceGenStatus: "idle" | "generating" | "generated" | "error";
  generatedInvoiceIds: Partial<Record<"meta" | "google" | "linkedin", string>>;
  metaDateRangeByAccount: Record<string, SerializedRange | undefined>;
  googleDateRangeByCustomer: Record<string, SerializedRange | undefined>;
  linkedInDateRangeByAccount: Record<string, SerializedRange | undefined>;
  kesPerUnitOverride: Record<string, string>;
  nodeDims: Record<string, { width: number; height: number }>;
  nodePositions: Record<string, { x: number; y: number }>;
  selectedEdgeIds: string[];
  flowSelectedIds: string[];
};

type SerializedRange = { from?: string | null; to?: string | null };

function serializeRange(r: DateRange | undefined): SerializedRange | undefined {
  if (!r) return undefined;
  return {
    from: r.from ? r.from.toISOString() : null,
    to: r.to ? r.to.toISOString() : null,
  };
}

function parseRange(s: SerializedRange | undefined): DateRange | undefined {
  if (!s?.from && !s?.to) return undefined;
  return {
    from: s.from ? new Date(s.from) : undefined,
    to: s.to ? new Date(s.to) : undefined,
  };
}

function parseRanges(
  raw: Record<string, SerializedRange | undefined> | undefined,
): Record<string, DateRange | undefined> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, DateRange | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = parseRange(v);
  }
  return out;
}

export function isMediaBuyingGraphPayload(x: unknown): x is MediaBuyingGraphPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === MEDIA_BUYING_GRAPH_V;
}

/** Build JSON for autosave (no PDF blobs). */
export function buildMediaBuyingGraphPayload(input: {
  selectedPlanId: string | null;
  selectedMetaAccountIds: string[];
  selectedGoogleCustomerIds: string[];
  selectedLinkedInAccountIds: string[];
  selectedMetaByAccount: SelectedByParent;
  selectedGoogleByCustomer: SelectedByParent;
  selectedLinkedInByAccount: SelectedByParent;
  metaFeeInput: string;
  googleFeeInput: string;
  linkedInFeeInput: string;
  metaFeeCurrency: string;
  googleFeeCurrency: string;
  linkedInFeeCurrency: string;
  invoiceDefaults: InvoiceDefaults;
  selectedBillToTeamId: string;
  qrStepDone: boolean;
  invoiceGenStatus: MediaBuyingGraphPayload["invoiceGenStatus"];
  generatedInvoiceIds: MediaBuyingGraphPayload["generatedInvoiceIds"];
  metaDateRangeByAccount: Record<string, DateRange | undefined>;
  googleDateRangeByCustomer: Record<string, DateRange | undefined>;
  linkedInDateRangeByAccount: Record<string, DateRange | undefined>;
  kesPerUnitOverride: Record<string, string>;
  nodeDims: Record<string, { width: number; height: number }>;
  nodePositions: Record<string, { x: number; y: number }>;
  selectedEdgeIds: string[];
  flowSelectedIds: string[];
}): MediaBuyingGraphPayload {
  const meta: Record<string, SerializedRange | undefined> = {};
  for (const [k, v] of Object.entries(input.metaDateRangeByAccount)) {
    meta[k] = serializeRange(v);
  }
  const google: Record<string, SerializedRange | undefined> = {};
  for (const [k, v] of Object.entries(input.googleDateRangeByCustomer)) {
    google[k] = serializeRange(v);
  }
  const li: Record<string, SerializedRange | undefined> = {};
  for (const [k, v] of Object.entries(input.linkedInDateRangeByAccount)) {
    li[k] = serializeRange(v);
  }

  return {
    v: MEDIA_BUYING_GRAPH_V,
    selectedPlanId: input.selectedPlanId,
    selectedMetaAccountIds: input.selectedMetaAccountIds,
    selectedGoogleCustomerIds: input.selectedGoogleCustomerIds,
    selectedLinkedInAccountIds: input.selectedLinkedInAccountIds,
    selectedMetaByAccount: input.selectedMetaByAccount,
    selectedGoogleByCustomer: input.selectedGoogleByCustomer,
    selectedLinkedInByAccount: input.selectedLinkedInByAccount,
    metaFeeInput: input.metaFeeInput,
    googleFeeInput: input.googleFeeInput,
    linkedInFeeInput: input.linkedInFeeInput,
    metaFeeCurrency: input.metaFeeCurrency,
    googleFeeCurrency: input.googleFeeCurrency,
    linkedInFeeCurrency: input.linkedInFeeCurrency,
    invoiceDefaults: input.invoiceDefaults,
    selectedBillToTeamId: input.selectedBillToTeamId,
    qrStepDone: input.qrStepDone,
    invoiceGenStatus: input.invoiceGenStatus,
    generatedInvoiceIds: input.generatedInvoiceIds,
    metaDateRangeByAccount: meta,
    googleDateRangeByCustomer: google,
    linkedInDateRangeByAccount: li,
    kesPerUnitOverride: input.kesPerUnitOverride,
    nodeDims: input.nodeDims,
    nodePositions: input.nodePositions,
    selectedEdgeIds: input.selectedEdgeIds,
    flowSelectedIds: input.flowSelectedIds,
  };
}

export type HydrateMediaBuyingResult = Omit<
  MediaBuyingGraphPayload,
  | "metaDateRangeByAccount"
  | "googleDateRangeByCustomer"
  | "linkedInDateRangeByAccount"
> & {
  metaDateRangeByAccount: Record<string, DateRange | undefined>;
  googleDateRangeByCustomer: Record<string, DateRange | undefined>;
  linkedInDateRangeByAccount: Record<string, DateRange | undefined>;
};

export function hydrateMediaBuyingFromGraph(
  raw: unknown,
  invoiceIdsFromDb?: Partial<Record<"meta" | "google" | "linkedin", string>>,
): HydrateMediaBuyingResult | null {
  if (!isMediaBuyingGraphPayload(raw)) return null;
  const mergedIds = {
    ...raw.generatedInvoiceIds,
    ...invoiceIdsFromDb,
  };
  return {
    ...raw,
    generatedInvoiceIds: mergedIds,
    metaDateRangeByAccount: parseRanges(raw.metaDateRangeByAccount),
    googleDateRangeByCustomer: parseRanges(raw.googleDateRangeByCustomer),
    linkedInDateRangeByAccount: parseRanges(raw.linkedInDateRangeByAccount),
  };
}
