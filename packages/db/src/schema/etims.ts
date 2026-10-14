import { index, integer, pgTable, primaryKey, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const eTimsConfiguration = pgTable(
  "etims_configuration",
  {
    id: text("id").primaryKey(),
    kraPin: text("kra_pin").notNull(),
    branchId: text("branch_id").default("00").notNull(),
    branchName: text("branch_name"),

    deviceSerialNumber: text("device_serial_number").notNull(),
    cmcKey: text("cmc_key"),
    /** KRA control-unit id from initialize (`info.sdcId`). Used as CU ID / SCU ID on receipts. */
    sdcId: text("sdc_id"),

    isSandbox: boolean("is_sandbox").default(true).notNull(),
    isInitialized: boolean("is_initialized").default(false).notNull(),

    lastSyncAt: timestamp("last_sync_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("etims_configuration_kraPin_branchId_idx").on(table.kraPin, table.branchId)],
);

export const eTimsItem = pgTable(
  "etims_item",
  {
    id: text("id").primaryKey(),
    localItemId: text("local_item_id"),

    itemCd: text("item_cd").notNull(),
    itemClsCd: text("item_cls_cd").notNull(),
    itemNm: text("item_nm").notNull(),
    taxTyCd: text("tax_ty_cd").default("A").notNull(),
    pkgUnitCd: text("pkg_unit_cd").default("OU").notNull(),

    originCountryCd: text("origin_country_cd"),
    packagingUnit: text("packaging_unit"),
    quantityUnit: text("quantity_unit"),
    unitPrice: text("unit_price"),
    rsdQty: text("rsd_qty"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("etims_item_itemCd_unique").on(table.itemCd)],
);

/** Local ledger of /insertStockIO rows. KRA has no select for stock I/O. */
export const eTimsStockMovement = pgTable(
  "etims_stock_movement",
  {
    id: text("id").primaryKey(),
    itemCd: text("item_cd").notNull(),
    itemNm: text("item_nm").notNull(),
    sarTyCd: text("sar_ty_cd").notNull(),
    sarNo: integer("sar_no"),
    qty: text("qty").notNull(),
    ocrnDt: text("ocrn_dt").notNull(),
    remark: text("remark"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("etims_stock_movement_itemCd_idx").on(table.itemCd)],
);

/** KRA UNSPSC item classification codes synced from POST /selectItemClsList. */
export const eTimsItemClassification = pgTable(
  "etims_item_classification",
  {
    itemClsCd: text("item_cls_cd").primaryKey(),
    itemClsNm: text("item_cls_nm").notNull(),
    itemClsLvl: integer("item_cls_lvl").notNull(),
    taxTyCd: text("tax_ty_cd"),
    mjrTgYn: text("mjr_tg_yn"),
    useYn: text("use_yn").default("Y"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (table) => [index("etims_item_classification_level_idx").on(table.itemClsLvl)],
);

/** KRA standard codes synced from POST /selectCodeList (tax, units, countries, …). */
export const eTimsCode = pgTable(
  "etims_code",
  {
    cdCls: text("cd_cls").notNull(),
    cdClsNm: text("cd_cls_nm").notNull(),
    cd: text("cd").notNull(),
    cdNm: text("cd_nm").notNull(),
    useYn: text("use_yn").default("Y"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ name: "etims_code_pk", columns: [table.cdCls, table.cd] }),
    index("etims_code_cls_idx").on(table.cdCls),
  ],
);

/** Remaining qty for a partial KRA sale (first NS is the seed invoice). */
export const eTimsPartialOrder = pgTable(
  "etims_partial_order",
  {
    id: text("id").primaryKey(),
    seedInvcNo: integer("seed_invc_no").notNull(),
    trdInvcNo: text("trd_invc_no"),
    itemCd: text("item_cd").notNull(),
    itemNm: text("item_nm").notNull(),
    itemClsCd: text("item_cls_cd"),
    pkgUnitCd: text("pkg_unit_cd"),
    qtyUnitCd: text("qty_unit_cd"),
    taxTyCd: text("tax_ty_cd"),
    inclusivePrc: text("inclusive_prc").notNull(),
    dcRt: text("dc_rt"),
    orderedQty: text("ordered_qty").notNull(),
    invoicedQty: text("invoiced_qty").notNull(),
    custTin: text("cust_tin"),
    custNm: text("cust_nm"),
    pmtTyCd: text("pmt_ty_cd"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("etims_partial_order_seed_item_idx").on(table.seedInvcNo, table.itemCd),
    index("etims_partial_order_seed_idx").on(table.seedInvcNo),
  ],
);
