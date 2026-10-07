import { creditNoteReasonLabel } from "./issue-etims-credit-note-sheet";
import { formatKraHumanDateTime, kraStampMillis, parseKraStamp } from "../../_lib/etims-kra";

export { formatKraHumanDateTime, kraStampMillis, parseKraStamp };

export type EtimsSaleRecord = Record<string, unknown> & {
    invcNo: number;
    orgInvcNo?: number | null;
    custTin?: string | null;
    custNm?: string | null;
    rcptTyCd?: string | null;
    pmtTyCd?: string | null;
    salesSttsCd?: string | null;
    salesDt?: string | null;
    cfmDt?: string | null;
    stockRlsDt?: string | null;
    rfdDt?: string | null;
    rfdRsnCd?: string | null;
    totItemCnt?: number | null;
    totTaxblAmt?: number | null;
    totTaxAmt?: number | null;
    totAmt?: number | null;
    remark?: string | null;
    prchrAcptcYn?: string | null;
    itemList?: Array<Record<string, unknown>>;
    receipt?: Record<string, unknown>;
    displayAmount?: number;
    displayKraRef?: string | null;
    displayRcptNo?: string | null;
    rcptSign?: string | null;
};

const PAYMENT_LABELS: Record<string, string> = {
    "01": "Cash",
    "02": "Credit",
    "03": "Cash/Credit",
    "04": "Bank cheque",
    "05": "Debit/Credit card",
    "06": "Mobile money",
    "07": "Other",
};

export function normalizeSalesListItem(raw: Record<string, unknown>): EtimsSaleRecord {
    const receipt = (raw.receipt ?? {}) as Record<string, unknown>;
    const itemList = Array.isArray(raw.itemList) ? raw.itemList as Record<string, unknown>[] : [];

    const lineAmount = itemList.reduce((sum, line) => sum + lineDisplayAmount(line), 0);

    const headerTot = Number(raw.totAmt ?? 0);
    const headerTaxbl = Number(raw.totTaxblAmt ?? 0);
    const headerTax = Number(raw.totTaxAmt ?? 0);
    const displayAmount = headerTot > 0
        ? headerTot
        : headerTaxbl > 0 || headerTax > 0
            ? headerTaxbl + headerTax
            : lineAmount;

    const curRcptNo = receipt.curRcptNo ?? raw.curRcptNo;
    const totRcptNo = receipt.totRcptNo ?? raw.totRcptNo;
    const rcptSign = receipt.rcptSign ?? raw.rcptSign;
    const displayKraRef = rcptSign
        ? String(rcptSign)
        : curRcptNo
            ? totRcptNo && totRcptNo !== curRcptNo
                ? `${curRcptNo}/${totRcptNo}`
                : String(curRcptNo)
            : raw.rcptNo
                ? String(raw.rcptNo)
                : null;

    return {
        ...raw,
        displayAmount,
        displayKraRef,
        displayRcptNo: curRcptNo ? String(curRcptNo) : null,
        rcptSign: rcptSign ? String(rcptSign) : null,
    } as EtimsSaleRecord;
}

export function lineDisplayAmount(line: Record<string, unknown>) {
    const totAmt = Number(line.totAmt ?? 0);
    if (totAmt > 0) return totAmt;
    const taxblAmt = Number(line.taxblAmt ?? 0);
    const taxAmt = Number(line.taxAmt ?? 0);
    if (taxblAmt > 0 || taxAmt > 0) return taxblAmt + taxAmt;
    const splyAmt = Number(line.splyAmt ?? 0);
    if (splyAmt > 0) return splyAmt;
    return Number(line.prc ?? 0) * Number(line.qty ?? 1);
}

export function lineTaxableAmount(line: Record<string, unknown>) {
    const taxbl = Number(line.taxblAmt ?? 0);
    if (taxbl > 0) return taxbl;
    const tot = Number(line.totAmt ?? 0);
    const tax = Number(line.taxAmt ?? 0);
    if (tot > 0 && tax > 0) return tot - tax;
    return Number(line.splyAmt ?? 0) || Number(line.prc ?? 0) * Number(line.qty ?? 1);
}

export function formatKraDateTime(value?: string | null) {
    if (!value) return "";
    return String(value).replace("T", " ").replace(/\.0+$/, "").trim();
}

export function compareKraNewestFirst(a: EtimsSaleRecord, b: EtimsSaleRecord): number {
    const aT = kraStampMillis(String(a.cfmDt ?? a.rfdDt ?? a.salesDt ?? ""));
    const bT = kraStampMillis(String(b.cfmDt ?? b.rfdDt ?? b.salesDt ?? ""));
    if (bT !== aT) return bT - aT;
    return Number(b.invcNo ?? 0) - Number(a.invcNo ?? 0);
}

export function formatSaleTableDateTime(sale: EtimsSaleRecord & { salesTime?: string | null }): string {
    const salesTime = String(sale.salesTime ?? "").replace(/\D/g, "");
    const salesDt = String(sale.salesDt ?? "");
    const combined =
        salesDt.length === 8 && salesTime.length >= 4
            ? `${salesDt}${salesTime.padEnd(6, "0").slice(0, 6)}`
            : salesDt;
    const preferred = isCreditNote(sale) ? sale.rfdDt || sale.cfmDt : sale.cfmDt || sale.rfdDt;
    return formatKraHumanDateTime(preferred) || formatKraHumanDateTime(combined) || "";
}

export function formatSalesDate(value?: string | null) {
    if (!value) return "";
    const s = String(value);
    if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    return formatKraDateTime(s);
}

export function formatMoney(value?: number | null) {
    const n = Number(value ?? 0);
    return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KES`;
}

export function paymentTypeLabel(code?: string | null) {
    if (!code) return "";
    return PAYMENT_LABELS[code] ?? code;
}

export function receiptTypeLabel(code?: string | null) {
    if (code === "S") return "Sale";
    if (code === "R") return "Credit note";
    return code ?? "";
}

export function sumLineItems(itemList: Array<Record<string, unknown>> | undefined) {
    const lines = itemList ?? [];
    return lines.reduce(
        (acc, line) => ({
            qty: acc.qty + Number(line.qty ?? 0),
            taxbl: acc.taxbl + lineTaxableAmount(line),
            tax: acc.tax + Number(line.taxAmt ?? 0),
            total: acc.total + lineDisplayAmount(line),
        }),
        { qty: 0, taxbl: 0, tax: 0, total: 0 },
    );
}

export function taxBandRows(sale: EtimsSaleRecord) {
    const bands = ["A", "B", "C", "D", "E"] as const;
    return bands.map((band) => ({
        band,
        taxbl: Number(sale[`taxblAmt${band}`] ?? 0),
        rate: Number(sale[`taxRt${band}`] ?? 0),
        tax: Number(sale[`taxAmt${band}`] ?? 0),
    }));
}

export function creditNoteReason(sale: EtimsSaleRecord) {
    return creditNoteReasonLabel(sale.rfdRsnCd as string | undefined);
}

export function isCreditNote(sale: EtimsSaleRecord) {
    return sale.rcptTyCd === "R";
}
