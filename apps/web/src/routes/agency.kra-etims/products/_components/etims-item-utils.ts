import { formatKraHumanDateTime, kraStampMillis } from "../../_lib/etims-kra";

export type EtimsItemRecord = {
    itemCd: string;
    itemClsCd: string;
    itemTyCd?: string | null;
    itemNm: string;
    itemStdNm?: string | null;
    orgnNatCd?: string | null;
    pkgUnitCd?: string | null;
    qtyUnitCd?: string | null;
    taxTyCd?: string | null;
    btchNo?: string | null;
    bcd?: string | null;
    dftPrc?: number | string | null;
    grpPrcL1?: number | string | null;
    grpPrcL2?: number | string | null;
    grpPrcL3?: number | string | null;
    grpPrcL4?: number | string | null;
    grpPrcL5?: number | string | null;
    addInfo?: string | null;
    sftyQty?: number | string | null;
    rsdQty?: number | string | null;
    useYn?: string | null;
    isrcAplcbYn?: string | null;
    regBhfId?: string | null;
    rraModYn?: string | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
};

export function isServiceItem(item: EtimsItemRecord) {
    if (String(item.itemTyCd ?? "") === "3") return true;
    return /^[A-Z]{2}3/.test(String(item.itemCd ?? ""));
}

export function isRawMaterial(item: EtimsItemRecord) {
    if (String(item.itemTyCd ?? "") === "1") return true;
    return /^[A-Z]{2}1/.test(String(item.itemCd ?? ""));
}

export function isFinishedProduct(item: EtimsItemRecord) {
    if (String(item.itemTyCd ?? "") === "2") return true;
    return /^[A-Z]{2}2/.test(String(item.itemCd ?? ""));
}

function itemStamp(item: EtimsItemRecord) {
    const value = item.createdAt ?? item.updatedAt;
    if (value instanceof Date) return value.toISOString();
    return String(value ?? "");
}

function itemSeq(item: EtimsItemRecord) {
    const match = String(item.itemCd ?? "").match(/(\d{7})$/);
    return match ? Number(match[1]) : 0;
}

export function compareItemsNewestFirst(a: EtimsItemRecord, b: EtimsItemRecord) {
    const aT = kraStampMillis(itemStamp(a));
    const bT = kraStampMillis(itemStamp(b));
    if (bT !== aT) return bT - aT;
    return itemSeq(b) - itemSeq(a);
}

export function formatItemTableDateTime(item: EtimsItemRecord) {
    return formatKraHumanDateTime(itemStamp(item));
}

export function itemTypeLabel(code?: string | null) {
    switch (code) {
        case "1": return "Raw material";
        case "2": return "Finished product";
        case "3": return "Service";
        default: return code ?? "";
    }
}

export function taxTypeLabel(code?: string | null) {
    switch (code) {
        case "A": return "Exempt";
        case "B": return "16% VAT";
        case "C": return "0%";
        case "D": return "Non-VAT";
        case "E": return "8% VAT";
        default: return code ?? "";
    }
}

export function itemToSavePayload(item: EtimsItemRecord, overrides?: { useYn?: "Y" | "N" }) {
    const price = Number(item.dftPrc ?? 0);
    const itemTyCd = String(item.itemTyCd ?? "3");
    if (itemTyCd !== "1" && itemTyCd !== "2" && itemTyCd !== "3") {
        throw new Error("Invalid item type");
    }

    return {
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemTyCd: itemTyCd as "1" | "2" | "3",
        itemNm: item.itemNm,
        itemStdNm: item.itemStdNm ?? null,
        orgnNatCd: item.orgnNatCd ?? "KE",
        pkgUnitCd: item.pkgUnitCd ?? "OU",
        qtyUnitCd: item.qtyUnitCd ?? "U",
        taxTyCd: (item.taxTyCd ?? "B") as "A" | "B" | "C" | "D" | "E",
        btchNo: item.btchNo ?? null,
        bcd: item.bcd ?? null,
        dftPrc: price,
        grpPrcL1: Number(item.grpPrcL1 ?? price),
        grpPrcL2: Number(item.grpPrcL2 ?? price),
        grpPrcL3: Number(item.grpPrcL3 ?? price),
        grpPrcL4: Number(item.grpPrcL4 ?? price),
        grpPrcL5: Number(item.grpPrcL5 ?? 0),
        addInfo: item.addInfo ?? null,
        sftyQty: item.sftyQty != null ? Number(item.sftyQty) : null,
        isrcAplcbYn: (item.isrcAplcbYn === "Y" ? "Y" : "N") as "Y" | "N",
        useYn: overrides?.useYn ?? ((item.useYn === "N" ? "N" : "Y") as "Y" | "N"),
        regrId: "Admin",
        regrNm: "Admin",
        modrId: "Admin",
        modrNm: "Admin",
    };
}
