import { index, integer, pgTable, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
export const eTimsConfiguration = pgTable("etims_configuration", {
    id: text("id").primaryKey(),
    kraPin: text("kra_pin").notNull(),
    branchId: text("branch_id").default("00").notNull(),
    branchName: text("branch_name"),
    deviceSerialNumber: text("device_serial_number").notNull(),
    cmcKey: text("cmc_key"),
    isSandbox: boolean("is_sandbox").default(true).notNull(),
    isInitialized: boolean("is_initialized").default(false).notNull(),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [index("etims_configuration_kraPin_branchId_idx").on(table.kraPin, table.branchId)]);
export const eTimsItem = pgTable("etims_item", {
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [uniqueIndex("etims_item_itemCd_unique").on(table.itemCd)]);
/** KRA UNSPSC item classification codes synced from POST /selectItemClsList. */
export const eTimsItemClassification = pgTable("etims_item_classification", {
    itemClsCd: text("item_cls_cd").primaryKey(),
    itemClsNm: text("item_cls_nm").notNull(),
    itemClsLvl: integer("item_cls_lvl").notNull(),
    taxTyCd: text("tax_ty_cd"),
    mjrTgYn: text("mjr_tg_yn"),
    useYn: text("use_yn").default("Y"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
}, (table) => [index("etims_item_classification_level_idx").on(table.itemClsLvl)]);
