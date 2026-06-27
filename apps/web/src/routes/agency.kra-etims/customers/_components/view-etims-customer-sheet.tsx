"use client";

import * as React from "react";
import {
    User,
    Hash,
    MapPin,
    Phone,
    Mail,
    Printer,
    FileText,
    Pencil,
    Trash2,
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
import type { EtimsCustomerFormValues } from "./save-etims-customer-sheet";

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

export function ViewETimsCustomerSheet({
    open,
    onOpenChange,
    customer,
    onEdit,
    onDeleteRequest,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: EtimsCustomerFormValues | null;
    onEdit?: (customer: EtimsCustomerFormValues) => void;
    onDeleteRequest?: (customer: EtimsCustomerFormValues) => void;
}) {
    if (!customer) return null;

    const isActive = customer.useYn !== "N";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">{customer.custNm}</SheetTitle>
                            <SheetDescription className="font-mono text-xs">
                                Branch customer #{customer.custNo}
                            </SheetDescription>
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
                    <DetailRow icon={Hash} label="KRA PIN / TIN" value={customer.custTin} mono />
                    <DetailRow icon={User} label="Customer name" value={customer.custNm} />
                    <DetailRow icon={MapPin} label="Address" value={customer.adrs} />
                    <DetailRow icon={Phone} label="Phone" value={customer.telNo} mono />
                    <DetailRow icon={Mail} label="Email" value={customer.email} />
                    <DetailRow icon={Printer} label="Fax" value={customer.faxNo} mono />
                    <DetailRow icon={FileText} label="Remark" value={customer.remark} />
                </div>

                <SheetFooter className="mt-8 flex-col gap-2 sm:flex-row sm:justify-between">
                    {isActive && onDeleteRequest ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="text-destructive hover:text-destructive w-full sm:w-auto"
                            onClick={() => onDeleteRequest(customer)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove customer
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
                                onEdit(customer);
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit customer
                        </Button>
                    ) : null}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
