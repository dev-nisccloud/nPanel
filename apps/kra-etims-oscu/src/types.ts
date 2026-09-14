import type { TaxTyCd, ItemTyCd, CreditNoteReasonCd } from "./codes";

export type Yn = "Y" | "N";

export type OscuIdentity = {
  tin: string;
  bhfId: string;
  cmcKey: string;
};

export type DeviceInfo = {
  tin?: string;
  taxprNm?: string;
  bsnsActv?: string;
  bhfId?: string;
  bhfNm?: string;
  bhfOpenDt?: string;
  prvncNm?: string;
  dstrtNm?: string;
  sctrNm?: string;
  locDesc?: string;
  hqYn?: Yn;
  mgrNm?: string;
  mgrTelNo?: string;
  mgrEmail?: string;
  dvcId?: string;
  sdcId?: string;
  mrcNo?: string;
  cmcKey?: string;
};

export type CodeRow = {
  cdCls?: string;
  cdClsNm?: string;
  cd?: string;
  cdNm?: string;
  userDfnNm1?: string | null;
  userDfnNm2?: string | null;
  userDfnNm3?: string | null;
  useYn?: Yn;
};

export type ItemClassRow = {
  itemClsCd: string;
  itemClsNm: string;
  itemClsLvl?: number;
  taxTyCd?: string | null;
  mjrTgYn?: Yn | null;
  useYn?: Yn;
};

export type BranchRow = {
  tin?: string;
  bhfId: string;
  bhfNm?: string;
  bhfSttsCd?: string;
  prvncNm?: string;
  dstrtNm?: string;
  sctrNm?: string;
  locDesc?: string;
  mgrNm?: string;
  mgrTelNo?: string;
  mgrEmail?: string;
  hqYn?: Yn;
};

export type NoticeRow = {
  noticeNo?: number | string;
  title?: string;
  cont?: string;
  dtlUrl?: string;
  regrNm?: string;
  regDt?: string;
};

export type CustomerRow = {
  custNo?: string;
  custTin?: string;
  custNm?: string;
  adrs?: string | null;
  telNo?: string | null;
  email?: string | null;
  faxNo?: string | null;
  useYn?: Yn;
};

export type TaxpayerRow = {
  tin?: string;
  taxprNm?: string;
  taxprSttsCd?: string;
  prvncNm?: string;
  dstrtNm?: string;
  sctrNm?: string;
  locDesc?: string;
};

export type BranchCustomer = {
  custNo: string;
  custTin: string;
  custNm: string;
  adrs?: string | null;
  telNo?: string | null;
  email?: string | null;
  faxNo?: string | null;
  useYn?: Yn;
  remark?: string | null;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
};

export type BranchUser = {
  userId: string;
  userNm: string;
  pwd: string;
  adrs?: string | null;
  cntc?: string | null;
  authCd?: string | null;
  remark?: string | null;
  useYn?: Yn;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
};

export type BranchInsurance = {
  isrccCd: string;
  isrccNm: string;
  isrcRt: number;
  useYn?: Yn;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
};

export type ItemRecord = {
  itemCd: string;
  itemClsCd: string;
  itemTyCd: ItemTyCd | string;
  itemNm: string;
  itemStdNm?: string | null;
  orgnNatCd?: string;
  pkgUnitCd: string;
  qtyUnitCd: string;
  taxTyCd: TaxTyCd | string;
  btchNo?: string | null;
  bcd?: string | null;
  dftPrc: number;
  grpPrcL1?: number;
  grpPrcL2?: number;
  grpPrcL3?: number;
  grpPrcL4?: number;
  grpPrcL5?: number;
  addInfo?: string | null;
  sftyQty?: number | null;
  isrcAplcbYn?: Yn;
  useYn?: Yn;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
  regBhfId?: string;
  rraModYn?: Yn;
};

export type ItemComposition = {
  itemCd: string;
  cpstItemCd: string;
  cpstQty: number;
  regrId: string;
  regrNm: string;
  modrId?: string;
  modrNm?: string;
};

export type ImportedItem = {
  taskCd: string;
  dclDe: string;
  itemSeq: number;
  dclNo?: string;
  hsCd?: string;
  itemNm?: string;
  imptItemsttsCd?: string;
  orgnNatCd?: string;
  exptNatCd?: string;
  pkg?: number;
  pkgUnitCd?: string;
  qty?: number;
  qtyUnitCd?: string;
  totWt?: number;
  netWt?: number;
  spplrNm?: string;
  agntNm?: string;
  invcFcurAmt?: number;
  invcFcurCd?: string;
  invcFcurExcrt?: number;
};

export type ConvertImportedItem = {
  taskCd: string;
  dclDe: string;
  itemSeq: number;
  hsCd: string;
  itemClsCd: string;
  itemCd: string;
  imptItemSttsCd: string;
  modrId: string;
  modrNm: string;
  remark?: string | null;
};

export type SalesLine = {
  itemSeq: number;
  itemCd: string;
  itemClsCd?: string | null;
  itemNm: string;
  bcd?: string | null;
  pkgUnitCd: string;
  pkg: number;
  qtyUnitCd: string;
  qty: number;
  prc: number;
  splyAmt: number;
  dcRt: number;
  dcAmt: number;
  isrccCd?: string | null;
  isrccNm?: string | null;
  isrcRt?: number | null;
  isrcAmt?: number | null;
  taxTyCd: TaxTyCd | string;
  taxblAmt: number;
  taxAmt: number;
  totAmt: number;
};

export type SalesReceipt = {
  custTin?: string | null;
  custMblNo?: string | null;
  rcptPbctDt: string;
  trdeNm?: string | null;
  adrs?: string | null;
  topMsg?: string | null;
  btmMsg?: string | null;
  prchrAcptcYn: Yn;
  rptNo?: number | string | null;
};

export type SalesTransaction = {
  trdInvcNo: string | number;
  invcNo: number;
  orgInvcNo: number;
  custTin?: string | null;
  custNm?: string | null;
  salesTyCd: string;
  rcptTyCd: string;
  pmtTyCd?: string | null;
  salesSttsCd: string;
  cfmDt: string;
  salesDt: string;
  stockRlsDt?: string | null;
  cnclReqDt?: string | null;
  cnclDt?: string | null;
  rfdDt?: string | null;
  rfdRsnCd?: CreditNoteReasonCd | string | null;
  totItemCnt: number;
  taxblAmtA: number;
  taxblAmtB: number;
  taxblAmtC: number;
  taxblAmtD: number;
  taxblAmtE: number;
  taxRtA: number;
  taxRtB: number;
  taxRtC: number;
  taxRtD: number;
  taxRtE: number;
  taxAmtA: number;
  taxAmtB: number;
  taxAmtC: number;
  taxAmtD: number;
  taxAmtE: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  prchrAcptcYn: Yn;
  remark?: string | null;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
  receipt: SalesReceipt;
  itemList: SalesLine[];
};

export type SalesFiscalData = {
  curRcptNo?: number | string;
  totRcptNo?: number | string;
  intrlData?: string;
  rcptSign?: string;
  sdcDateTime?: string;
};

export type PurchaseLine = SalesLine & {
  spplrItemClsCd?: string | null;
  spplrItemCd?: string | null;
  spplrItemNm?: string | null;
  itemExprDt?: string | null;
};

export type PurchaseTransaction = {
  spplrTin?: string | null;
  invcNo: number;
  orgInvcNo: number;
  spplrBhfId?: string | null;
  spplrNm?: string | null;
  spplrInvcNo?: number | null;
  regTyCd: string;
  pchsTyCd: string;
  rcptTyCd: string;
  pmtTyCd: string;
  pchsSttsCd: string;
  cfmDt?: string | null;
  pchsDt?: string | null;
  wrhsDt?: string | null;
  cnclReqDt?: string | null;
  cnclDt?: string | null;
  rfdDt?: string | null;
  totItemCnt: number;
  taxblAmtA: number;
  taxblAmtB: number;
  taxblAmtC: number;
  taxblAmtD: number;
  taxblAmtE: number;
  taxRtA: number;
  taxRtB: number;
  taxRtC: number;
  taxRtD: number;
  taxRtE: number;
  taxAmtA: number;
  taxAmtB: number;
  taxAmtC: number;
  taxAmtD: number;
  taxAmtE: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  remark?: string | null;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
  itemList: PurchaseLine[];
};

export type StockIoLine = {
  itemSeq: number;
  itemCd: string;
  itemClsCd: string;
  itemNm: string;
  bcd?: string | null;
  pkgUnitCd: string;
  pkg: number;
  qtyUnitCd: string;
  qty: number;
  itemExprDt?: string | null;
  prc: number;
  splyAmt: number;
  totDcAmt: number;
  taxblAmt: number;
  taxTyCd: string;
  taxAmt: number;
  totAmt: number;
};

export type StockIo = {
  sarNo: number;
  orgSarNo: number;
  regTyCd: string;
  custTin?: string | null;
  custNm?: string | null;
  custBhfId?: string | null;
  sarTyCd: string;
  ocrnDt: string;
  totItemCnt: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  remark?: string | null;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
  itemList: StockIoLine[];
};

export type StockMaster = {
  itemCd: string;
  rsdQty: number;
  regrId: string;
  regrNm: string;
  modrId: string;
  modrNm: string;
};

export type TokenStore = {
  get(): Promise<{ token: string; expiresAtMs: number } | null>;
  set(token: string, expiresAtMs: number): Promise<void>;
  clear(): Promise<void>;
};
