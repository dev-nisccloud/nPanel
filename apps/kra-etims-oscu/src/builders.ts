import { DEFAULT_AUDITOR } from "./codes";
import { creditNoteRefundDt, kraDate, kraDateTime } from "./dates";
import { mergeTaxHeaders, salesLineAmounts, taxBuckets, type TaxBandTotals } from "./tax";
import type {
  BranchCustomer,
  BranchInsurance,
  BranchUser,
  ConvertImportedItem,
  ItemComposition,
  ItemRecord,
  PurchaseLine,
  PurchaseTransaction,
  SalesLine,
  SalesReceipt,
  SalesTransaction,
  StockIo,
  StockIoLine,
  StockMaster,
  Yn,
} from "./types";

export type Auditor = {
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
};

function auditor(extra?: Partial<Auditor>): Auditor {
  return { ...DEFAULT_AUDITOR, ...extra };
}

export function buildItem(
  item: Omit<ItemRecord, "regrId" | "regrNm" | "modrId" | "modrNm" | "useYn" | "isrcAplcbYn"> & {
    useYn?: Yn;
    isrcAplcbYn?: Yn;
  } & Partial<Auditor>,
): ItemRecord {
  return {
    orgnNatCd: "KE",
    grpPrcL1: 0,
    grpPrcL2: 0,
    grpPrcL3: 0,
    grpPrcL4: 0,
    grpPrcL5: 0,
    isrcAplcbYn: item.isrcAplcbYn ?? "N",
    useYn: item.useYn ?? "Y",
    ...auditor(item),
    ...item,
  };
}

export function buildCustomer(
  customer: Omit<BranchCustomer, "regrId" | "regrNm" | "modrId" | "modrNm" | "useYn"> & {
    useYn?: Yn;
  } & Partial<Auditor>,
): BranchCustomer {
  return { useYn: "Y", ...auditor(customer), ...customer };
}

export function buildBranchUser(
  user: Omit<BranchUser, "regrId" | "regrNm" | "modrId" | "modrNm" | "useYn"> & {
    useYn?: Yn;
  } & Partial<Auditor>,
): BranchUser {
  return { useYn: "Y", ...auditor(user), ...user };
}

export function buildInsurance(
  insurance: Omit<BranchInsurance, "regrId" | "regrNm" | "modrId" | "modrNm" | "useYn"> & {
    useYn?: Yn;
  } & Partial<Auditor>,
): BranchInsurance {
  return { useYn: "Y", ...auditor(insurance), ...insurance };
}

export function buildComposition(
  composition: Omit<ItemComposition, "regrId" | "regrNm"> & Partial<Auditor>,
): ItemComposition {
  const a = auditor(composition);
  return { ...a, ...composition, regrId: a.regrId, regrNm: a.regrNm };
}

export type BuiltSalesLineInput = {
  itemSeq: number;
  itemCd: string;
  itemNm: string;
  itemClsCd?: string | null;
  pkgUnitCd: string;
  qtyUnitCd: string;
  taxTyCd: string;
  /** Tax-exclusive amount for **one** unit. */
  taxblAmt: number;
  qty?: number;
  pkg?: number;
  dcRt?: number;
  dcAmt?: number;
};

/**
 * Line amounts that pass Gava Connect: `splyAmt === prc * qty` with VAT-inclusive `prc`.
 */
export function buildSalesLine(input: BuiltSalesLineInput): SalesLine {
  const qty = input.qty ?? 1;
  const amt = salesLineAmounts({ taxTyCd: input.taxTyCd, taxblAmt: input.taxblAmt, qty });
  return {
    itemSeq: input.itemSeq,
    itemCd: input.itemCd,
    itemClsCd: input.itemClsCd ?? null,
    itemNm: input.itemNm,
    bcd: null,
    pkgUnitCd: input.pkgUnitCd,
    pkg: input.pkg ?? qty,
    qtyUnitCd: input.qtyUnitCd,
    qty: amt.qty,
    prc: amt.prc,
    splyAmt: amt.splyAmt,
    dcRt: input.dcRt ?? 0,
    dcAmt: input.dcAmt ?? 0,
    isrccCd: null,
    isrccNm: null,
    isrcRt: null,
    isrcAmt: null,
    taxTyCd: input.taxTyCd,
    taxblAmt: amt.taxblAmt,
    taxAmt: amt.taxAmt,
    totAmt: amt.totAmt,
  };
}

export function taxHeadersFromLines(lines: SalesLine[]): TaxBandTotals {
  return mergeTaxHeaders(lines);
}

export type BuildSaleInput = {
  trdInvcNo: string | number;
  invcNo: number;
  orgInvcNo?: number;
  custTin?: string | null;
  custNm?: string | null;
  salesTyCd?: string;
  rcptTyCd?: string;
  pmtTyCd?: string | null;
  salesSttsCd?: string;
  cfmDt?: string;
  salesDt?: string;
  stockRlsDt?: string | null;
  rfdDt?: string | null;
  rfdRsnCd?: string | null;
  prchrAcptcYn?: Yn;
  remark?: string | null;
  receipt?: Partial<SalesReceipt>;
  itemList: SalesLine[];
} & Partial<Auditor>;

export function buildSale(input: BuildSaleInput): SalesTransaction {
  const cfmDt = input.cfmDt ?? kraDateTime();
  const salesDt = input.salesDt ?? kraDate();
  const { taxbl: _taxbl, tax: _tax, tot: _tot, ...headers } = taxHeadersFromLines(input.itemList);
  const custTin = input.custTin ?? null;
  return {
    trdInvcNo: input.trdInvcNo,
    invcNo: input.invcNo,
    orgInvcNo: input.orgInvcNo ?? 0,
    custTin,
    custNm: input.custNm ?? null,
    salesTyCd: input.salesTyCd ?? "N",
    rcptTyCd: input.rcptTyCd ?? "S",
    pmtTyCd: input.pmtTyCd ?? "01",
    salesSttsCd: input.salesSttsCd ?? "02",
    cfmDt,
    salesDt,
    stockRlsDt: input.stockRlsDt ?? cfmDt,
    cnclReqDt: null,
    cnclDt: null,
    rfdDt: input.rfdDt ?? null,
    rfdRsnCd: input.rfdRsnCd ?? null,
    totItemCnt: input.itemList.length,
    ...headers,
    prchrAcptcYn: input.prchrAcptcYn ?? "N",
    remark: input.remark ?? null,
    ...auditor(input),
    receipt: {
      custTin,
      custMblNo: null,
      rcptPbctDt: cfmDt,
      trdeNm: null,
      adrs: null,
      topMsg: null,
      btmMsg: null,
      prchrAcptcYn: input.prchrAcptcYn ?? "N",
      ...input.receipt,
    },
    itemList: input.itemList,
  };
}

export function buildCreditNote(
  input: BuildSaleInput & { orgInvcNo: number; rfdRsnCd: string; originalSdcDateTime?: string },
): SalesTransaction {
  const rfdDt = input.rfdDt ?? (input.originalSdcDateTime ? creditNoteRefundDt(input.originalSdcDateTime) : kraDateTime());
  return buildSale({
    ...input,
    rcptTyCd: "R",
    orgInvcNo: input.orgInvcNo,
    rfdDt,
    rfdRsnCd: input.rfdRsnCd,
  });
}

export type BuildPurchaseInput = {
  invcNo: number;
  orgInvcNo?: number;
  spplrTin?: string | null;
  spplrBhfId?: string | null;
  spplrNm?: string | null;
  spplrInvcNo?: number | null;
  regTyCd?: string;
  pchsTyCd?: string;
  rcptTyCd?: string;
  pmtTyCd?: string;
  pchsSttsCd?: string;
  cfmDt?: string;
  pchsDt?: string;
  remark?: string | null;
  itemList: PurchaseLine[];
} & Partial<Auditor>;

export function buildPurchase(input: BuildPurchaseInput): PurchaseTransaction {
  const cfmDt = input.cfmDt ?? kraDateTime();
  const { taxbl: _taxbl, tax: _tax, tot: _tot, ...headers } = taxHeadersFromLines(input.itemList);
  return {
    spplrTin: input.spplrTin ?? null,
    invcNo: input.invcNo,
    orgInvcNo: input.orgInvcNo ?? 0,
    spplrBhfId: input.spplrBhfId ?? "00",
    spplrNm: input.spplrNm ?? null,
    spplrInvcNo: input.spplrInvcNo ?? input.invcNo,
    regTyCd: input.regTyCd ?? "M",
    pchsTyCd: input.pchsTyCd ?? "N",
    rcptTyCd: input.rcptTyCd ?? "P",
    pmtTyCd: input.pmtTyCd ?? "01",
    pchsSttsCd: input.pchsSttsCd ?? "02",
    cfmDt,
    pchsDt: input.pchsDt ?? kraDate(),
    wrhsDt: null,
    cnclReqDt: null,
    cnclDt: null,
    rfdDt: null,
    totItemCnt: input.itemList.length,
    ...headers,
    remark: input.remark ?? null,
    ...auditor(input),
    itemList: input.itemList,
  };
}

export function buildStockIoLine(
  item: {
    itemCd: string;
    itemClsCd: string;
    itemNm: string;
    pkgUnitCd: string;
    qtyUnitCd: string;
    taxTyCd: string;
  },
  opts: { itemSeq: number; qty: number; taxblAmt?: number },
): StockIoLine {
  const taxbl = opts.taxblAmt ?? 0;
  const t = taxBuckets(item.taxTyCd, taxbl);
  const qty = opts.qty;
  return {
    itemSeq: opts.itemSeq,
    itemCd: item.itemCd,
    itemClsCd: item.itemClsCd,
    itemNm: item.itemNm,
    bcd: null,
    pkgUnitCd: item.pkgUnitCd,
    pkg: qty,
    qtyUnitCd: item.qtyUnitCd,
    qty,
    itemExprDt: null,
    prc: t.tot,
    splyAmt: t.tot * qty,
    totDcAmt: 0,
    taxblAmt: t.taxbl * qty,
    taxTyCd: item.taxTyCd,
    taxAmt: t.tax * qty,
    totAmt: t.tot * qty,
  };
}

export function buildStockIo(input: {
  sarNo: number;
  orgSarNo?: number;
  sarTyCd: string;
  ocrnDt?: string;
  custTin?: string | null;
  custNm?: string | null;
  custBhfId?: string | null;
  remark?: string | null;
  itemList: StockIoLine[];
} & Partial<Auditor>): StockIo {
  const totTaxblAmt = input.itemList.reduce((s, l) => s + l.taxblAmt, 0);
  const totTaxAmt = input.itemList.reduce((s, l) => s + l.taxAmt, 0);
  const totAmt = input.itemList.reduce((s, l) => s + l.totAmt, 0);
  return {
    sarNo: input.sarNo,
    orgSarNo: input.orgSarNo ?? 0,
    regTyCd: "M",
    custTin: input.custTin ?? null,
    custNm: input.custNm ?? null,
    custBhfId: input.custBhfId ?? null,
    sarTyCd: input.sarTyCd,
    ocrnDt: input.ocrnDt ?? kraDate(),
    totItemCnt: input.itemList.length,
    totTaxblAmt,
    totTaxAmt,
    totAmt,
    remark: input.remark ?? null,
    ...auditor(input),
    itemList: input.itemList,
  };
}

export function buildStockMaster(
  master: Omit<StockMaster, "regrId" | "regrNm" | "modrId" | "modrNm"> & Partial<Auditor>,
): StockMaster {
  return { ...auditor(master), ...master };
}

export function buildConvertImportedItem(
  item: Omit<ConvertImportedItem, "modrId" | "modrNm" | "imptItemSttsCd"> & {
    imptItemSttsCd?: string;
    modrId?: string;
    modrNm?: string;
  },
): ConvertImportedItem {
  return {
    imptItemSttsCd: "3",
    modrId: DEFAULT_AUDITOR.modrId,
    modrNm: DEFAULT_AUDITOR.modrNm,
    remark: null,
    ...item,
  };
}
