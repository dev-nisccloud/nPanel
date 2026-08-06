"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { useEffect } from "react";
import {
    Tag,
    Hash,
    Layers,
    Globe,
    Package,
    Scale,
    Banknote,
    Pencil,
    Trash2,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { itemTypeLabel, taxTypeLabel, type EtimsItemRecord } from "./etims-item-utils";

function DetailRow({
    icon: Icon,
    label,
    value,
    mono,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 px-4 py-3">
            <div className="mt-0.5 text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={`mt-1 text-sm text-foreground break-words ${mono ? "font-mono" : ""}`}>
                    {value ?? ""}
                </p>
            </div>
        </div>
    );
}

export function ViewETimsItemSheet({
    open,
    onOpenChange,
    item,
    onEdit,
    onDeleteRequest,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: EtimsItemRecord | null;
    onEdit?: (item: EtimsItemRecord) => void;
    onDeleteRequest?: (item: EtimsItemRecord) => void;
}) {
    React.useEffect(() => {
        if (open && item) captureEvent("etims_item_viewed");
    }, [open, item?.itemCd]);

    if (!item) return null;

    const isActive = item.useYn !== "N";
    const price = item.dftPrc != null && item.dftPrc !== "" ? Number(item.dftPrc) : null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">{item.itemNm}</SheetTitle>
                            <SheetDescription className="font-mono text-xs">{item.itemCd}</SheetDescription>
                        </div>
                        <Badge
                            variant={isActive ? "default" : "secondary"}
                            className={
                                isActive
                                    ? "shrink-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                                    : "shrink-0"
                            }
                        >
                            {isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-3">
                    <DetailRow icon={Hash} label="Item code" value={item.itemCd} mono />
                    <DetailRow icon={Layers} label="Classification (HS)" value={item.itemClsCd} mono />
                    <DetailRow icon={Tag} label="Item type" value={itemTypeLabel(item.itemTyCd)} />
                    <DetailRow icon={Scale} label="Tax type" value={taxTypeLabel(item.taxTyCd)} />
                    <DetailRow
                        icon={Banknote}
                        label="Default price"
                        value={price != null && Number.isFinite(price) ? `KES ${price.toLocaleString()}` : "Dynamic"}
                    />
                    <DetailRow icon={Package} label="Packaging unit" value={item.pkgUnitCd} mono />
                    <DetailRow icon={Package} label="Quantity unit" value={item.qtyUnitCd} mono />
                    <DetailRow icon={Globe} label="Country of origin" value={item.orgnNatCd} mono />
                    <DetailRow icon={Building2} label="Registered branch" value={item.regBhfId} mono />
                    {item.itemStdNm ? <DetailRow icon={Tag} label="Standard name" value={item.itemStdNm} /> : null}
                    {item.bcd ? <DetailRow icon={Hash} label="Barcode" value={item.bcd} mono /> : null}
                    {item.addInfo ? <DetailRow icon={Tag} label="Additional info" value={item.addInfo} /> : null}
                </div>

                <SheetFooter className="mt-8 flex-col gap-2 sm:flex-row sm:justify-between">
                    {isActive && onDeleteRequest ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="text-destructive hover:text-destructive w-full sm:w-auto"
                            onClick={() => onDeleteRequest(item)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete product
                        </Button>
                    ) : (
                        <div />
                    )}
                    {onEdit ? (
                        <Button
                            type="button"
                            className="w-full sm:w-auto sm:ml-auto"
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(item);
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit product
                        </Button>
                    ) : null}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
