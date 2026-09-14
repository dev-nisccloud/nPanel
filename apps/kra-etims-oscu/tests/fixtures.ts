/**
 * Sandbox Application Test identity used when nPanel scored Gava Connect.
 * Consumer key/secret stay in env — never commit them.
 */
export const SANDBOX_CERT_FIXTURE = {
  tin: "P600004455A",
  bhfId: "00",
  dvcSrlNo: "KRACUO100069163",
  tisName: "nPanel 3",
  lastReqDt: "20180101000000",
  customer: {
    custNo: "CUST001",
    custTin: "P600004455A",
    custNm: "Application Test Customer",
  },
  user: {
    userId: "npuser01",
    userNm: "nPanel Cert User",
    pwd: "CertPass123!",
  },
  insurance: {
    isrccCd: "ISRCC01",
    isrccNm: "Test Insurance Co",
    isrcRt: 10,
  },
  items: {
    parent: { itemCd: "KE1NTBA0000001", taxTyCd: "B", itemNm: "Cert Goods Parent" },
    child: { itemCd: "KE1NTBA0000002", taxTyCd: "A", itemNm: "Cert Goods Child" },
    pkgUnitCd: "NT",
    qtyUnitCd: "BA",
    itemTyCd: "1",
    orgnNatCd: "KE",
    classes: {
      A: { itemClsCd: "1010150000", itemClsNm: "Livestock" },
      B: { itemClsCd: "1010150100", itemClsNm: "Cats" },
      C: { itemClsCd: "9901200300", itemClsNm: "Shipstores" },
    },
  },
  sale: {
    invcNo: 1,
    trdInvcNo: "CERT121920",
    taxblAmt: 1000,
    pmtTyCd: "01",
  },
  importExample: {
    taskCd: "20230209030730",
    dclDe: "01022023",
    hsCd: "63079000",
    itemSeq: 1,
  },
} as const;
