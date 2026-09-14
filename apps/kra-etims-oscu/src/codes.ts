/** Official OSCU lookup tables (code classifications from KRA OSCU spec v2.0). */

/** `cdCls` values returned by `/selectCodeList`. */
export const CODE_CLASS = {
  TAX_TYPE: "04",
  COUNTRY: "05",
  PAYMENT: "07",
  QTY_UNIT: "10",
  TXN_STATUS: "11",
  STOCK_IO: "12",
  SALES_TYPE: "14",
  TAXPAYER_STATUS: "15",
  PACKAGING: "17",
  PRODUCT_TYPE: "24",
  IMPORT_STATUS: "26",
  REGISTRATION_TYPE: "31",
  CREDIT_NOTE_REASON: "32",
  CURRENCY: "33",
  SALES_RECEIPT_TYPE: "37",
  PURCHASE_RECEIPT_TYPE: "38",
} as const;

export const TAX_TYPE = {
  A: { code: "A", name: "Exempt", rate: 0, cls: "04" },
  B: { code: "B", name: "VAT 16%", rate: 16, cls: "04" },
  C: { code: "C", name: "Zero-rated", rate: 0, cls: "04" },
  D: { code: "D", name: "Non-VAT", rate: 0, cls: "04" },
  E: { code: "E", name: "Special 8%", rate: 8, cls: "04" },
} as const;

export type TaxTyCd = keyof typeof TAX_TYPE;

export const PRODUCT_TYPE = {
  "1": "Raw Material",
  "2": "Finished Product",
  "3": "Service",
} as const;

export type ItemTyCd = keyof typeof PRODUCT_TYPE;

export const TAXPAYER_STATUS = { A: "Active", D: "Inactive" } as const;

export const SALES_TYPE = {
  N: "Normal",
  C: "Copy",
  P: "Proforma",
  T: "Training",
} as const;

export const RECEIPT_TYPE = {
  S: "Sale",
  R: "Credit Note after Sale",
} as const;

export const PURCHASE_RECEIPT_TYPE = {
  P: "Purchase",
  R: "Credit Note after Purchase",
} as const;

export const PAYMENT_TYPE = {
  "01": "CASH",
  "02": "CREDIT",
  "03": "CASH/CREDIT",
  "04": "BANK CHECK",
  "05": "DEBIT & CREDIT CARD",
  "06": "MOBILE MONEY",
  "07": "OTHER",
} as const;

export const TXN_STATUS = {
  "01": "Wait for Approval",
  "02": "Approved",
  "03": "Cancel Requested",
  "04": "Cancelled",
  "05": "Credit Note Generated",
  "06": "Transferred",
} as const;

export const REGISTRATION_TYPE = { A: "Automatic", M: "Manual" } as const;

export const STOCK_IO_TYPE = {
  "01": "Import (in)",
  "02": "Purchase (in)",
  "03": "Return (in)",
  "04": "Stock Movement (in)",
  "05": "Processing (in)",
  "06": "Adjustment (in)",
  "11": "Sale (out)",
  "12": "Return (out)",
  "13": "Stock Movement (out)",
  "14": "Processing (out)",
  "15": "Discarding (out)",
  "16": "Adjustment (out)",
} as const;

export const IMPORT_ITEM_STATUS = {
  "1": "Unsent",
  "2": "Waiting",
  "3": "Approved",
  "4": "Cancelled",
} as const;

export const CREDIT_NOTE_REASON = {
  "01": "Missing Quantity",
  "02": "Missing Data",
  "03": "Damaged",
  "04": "Wasted",
  "05": "Raw Material Shortage",
  "06": "Refund",
} as const;

export type CreditNoteReasonCd = keyof typeof CREDIT_NOTE_REASON;

export const RESULT_CODES: Record<string, string> = {
  "000": "Success",
  "001": "No search result",
  "891": "Error creating Request URL",
  "892": "Error creating Request Header",
  "893": "Error creating Request Body",
  "894": "Server communication error",
  "895": "Unallowed Request Method",
  "896": "Request Status error",
  "899": "General client error",
  "900": "No header information",
  "901": "Invalid device",
  "902": "Device already installed",
  "903": "Only OSCU device can be verified",
  "910": "Request parameter error",
  "911": "No request body",
  "912": "Request Method error",
  "921": "Cannot receive declared sales/invoice data",
  "922": "Invoice data must come after sales data",
  "924": "Invoice number already exists",
  "990": "Maximum views exceeded",
  "991": "Error during registration",
  "992": "Error during modification",
  "993": "Error during deletion",
  "994": "Overlapping/duplicate data",
  "995": "No downloaded file",
  "999": "Unknown error — contact KRA",
};

export const PACKAGING_UNITS: Record<string, string> = {
  AM: "Ampoule",
  BA: "Barrel",
  BC: "Bottlecrate",
  BD: "Board",
  BE: "Bundle",
  BG: "Bag",
  BJ: "Bucket",
  BK: "Basket",
  BL: "Bale",
  BN: "Bale, non-compressed",
  BO: "Bottle",
  BX: "Box",
  CA: "Can",
  CH: "Chest",
  CR: "Crate",
  CS: "Case",
  CT: "Carton",
  CTN: "Container",
  CY: "Cylinder",
  DR: "Drum",
  FL: "Flask",
  JG: "Jug",
  JR: "Jar",
  NE: "Unpacked or unpackaged",
  NT: "Net",
  OU: "Non-Exterior Packaging Unit",
  PK: "Package",
  PL: "Pail",
  RO: "Roll",
  SA: "Sack",
  ST: "Sheet",
  TB: "Tub",
  TK: "Tank",
  TN: "Tin",
  TU: "Tube",
  TY: "Tank, cylindrical",
  VG: "Bulk, gas",
  VL: "Bulk, liquid",
  VO: "Bulk, solid",
};

export const QTY_UNITS: Record<string, string> = {
  U: "Pieces/Item",
  EA: "Each",
  PCS: "Pieces",
  BA: "Barrel",
  KG: "Kilo-Gramme",
  KGM: "Kilogram",
  GRM: "Gram",
  G: "Gram",
  TNE: "Tonne",
  L: "Litre",
  LTR: "Litre",
  ML: "Millilitre",
  M: "Metre",
  MTR: "Metre",
  M2: "Square Metre",
  MTK: "Square Metre",
  M3: "Cubic Metre",
  MTQ: "Cubic Metre",
  SET: "Set",
  DZ: "Dozen",
  BX: "Box",
  PA: "Packet",
  PR: "Pair",
  HR: "Hour",
  MIN: "Minute",
  SEC: "Second",
  KWH: "Kilowatt hour",
  NT: "Net",
};

export const CURRENCIES: Record<string, string> = {
  KES: "Kenyan Shilling",
  USD: "United States Dollar",
  EUR: "Euro",
  GBP: "Pound Sterling",
  TZS: "Tanzanian Shilling",
  UGX: "Ugandan Shilling",
  AED: "UAE Dirham",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
};

export const COUNTRIES: Record<string, string> = {
  KE: "KENYA",
  US: "UNITED STATES",
  GB: "GREAT BRITAIN (UK)",
  CN: "CHINA",
  IN: "INDIA",
  ZA: "SOUTH AFRICA",
  TZ: "TANZANIA",
  UG: "UGANDA",
  RW: "RWANDA",
  BI: "BURUNDI",
  SS: "SOUTH SUDAN",
  ET: "ETHIOPIA",
  SO: "SOMALIA",
  DJ: "DJIBOUTI",
  AE: "UNITED ARAB EMIRATES",
  SA: "SAUDI ARABIA",
  EG: "EGYPT",
  NG: "NIGERIA",
  GH: "GHANA",
  DE: "GERMANY",
  NL: "NETHERLANDS",
  BE: "BELGIUM",
  FR: "FRANCE",
  IT: "ITALY",
  ES: "SPAIN",
  CH: "SWITZERLAND",
  JP: "JAPAN",
  KR: "SOUTH KOREA",
  SG: "SINGAPORE",
  TR: "TURKEY",
  BR: "BRAZIL",
  CA: "CANADA",
  AU: "AUSTRALIA",
};

export const BRANCH_STATUS = {
  "01": "Active",
  "02": "Closed",
} as const;

export const DEFAULT_AUDITOR = {
  regrId: "Admin",
  regrNm: "Admin",
  modrId: "Admin",
  modrNm: "Admin",
} as const;
