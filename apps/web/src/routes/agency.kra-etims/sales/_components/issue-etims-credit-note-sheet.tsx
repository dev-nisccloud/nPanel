"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";

export const CREDIT_NOTE_REASONS = [
    { code: "01", label: "Missing Quantity" },
    { code: "02", label: "Missing Data" },
    { code: "03", label: "Damaged" },
    { code: "04", label: "Wasted" },
    { code: "05", label: "Raw Material Shortage" },
    { code: "06", label: "Refund" },
] as const;

const formSchema = z.object({
    orgInvcNo: z.string().min(1, "Select the original invoice"),
    rfdRsnCd: z.enum(["01", "02", "03", "04", "05", "06"]),
    remark: z.string().max(400).optional(),
});

type FormData = z.infer<typeof formSchema>;

export type EtimsSaleForCreditNote = {
    invcNo: number;
    custTin?: string | null;
    custNm?: string | null;
    pmtTyCd?: string | null;
    itemList?: Array<Record<string, unknown>>;
    displayAmount?: number;
};

export function creditNoteReasonLabel(code?: string | null) {
    return CREDIT_NOTE_REASONS.find((r) => r.code === code)?.label ?? code ?? "";
}

export function buildCreditNotePayload(sale: EtimsSaleForCreditNote, rfdRsnCd: FormData["rfdRsnCd"], remark?: string) {
    const now = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    const salesDt = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;
    const dt14 = `${salesDt}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    const newInvcNo = Math.floor(Math.random() * 900000) + 100000;

    const lines = Array.isArray(sale.itemList) ? sale.itemList : [];
    const mappedLines = lines.map((line, idx) => {
        const taxblAmt = Number(line.taxblAmt ?? 0);
        const taxAmt = Number(line.taxAmt ?? 0);
        const totAmt = Number(line.totAmt ?? 0) || taxblAmt + taxAmt || Number(line.splyAmt ?? 0);
        const taxTyCd = String(line.taxTyCd ?? "B");
        return {
            itemSeq: idx + 1,
            itemCd: String(line.itemCd ?? ""),
            itemClsCd: line.itemClsCd ? String(line.itemClsCd) : undefined,
            itemNm: String(line.itemNm ?? "Item"),
            pkgUnitCd: String(line.pkgUnitCd ?? "OU"),
            pkg: Number(line.pkg ?? 1),
            qtyUnitCd: String(line.qtyUnitCd ?? "U"),
            qty: Number(line.qty ?? 1),
            prc: Number(line.prc ?? taxblAmt),
            splyAmt: Number(line.splyAmt ?? taxblAmt),
            dcRt: 0,
            dcAmt: 0,
            taxTyCd,
            taxblAmt,
            taxAmt,
            totAmt,
        };
    });

    const taxblAmtB = mappedLines.filter((l) => l.taxTyCd === "B").reduce((s, l) => s + l.taxblAmt, 0);
    const taxAmtB = mappedLines.filter((l) => l.taxTyCd === "B").reduce((s, l) => s + l.taxAmt, 0);
    const totTaxblAmt = mappedLines.reduce((s, l) => s + l.taxblAmt, 0);
    const totTaxAmt = mappedLines.reduce((s, l) => s + l.taxAmt, 0);
    const totAmt = mappedLines.reduce((s, l) => s + l.totAmt, 0);

    return {
        trdInvcNo: `CN${newInvcNo}`,
        invcNo: newInvcNo,
        orgInvcNo: sale.invcNo,
        custTin: sale.custTin ?? null,
        custNm: sale.custNm ?? null,
        salesTyCd: "N",
        rcptTyCd: "R" as const,
        pmtTyCd: sale.pmtTyCd ?? "01",
        salesSttsCd: "02",
        cfmDt: dt14,
        salesDt,
        rfdDt: dt14,
        rfdRsnCd,
        totItemCnt: mappedLines.length || 1,
        taxblAmtA: 0,
        taxblAmtB,
        taxblAmtC: 0,
        taxblAmtD: 0,
        taxblAmtE: 0,
        taxRtA: 0,
        taxRtB: 16,
        taxRtC: 0,
        taxRtD: 0,
        taxRtE: 0,
        taxAmtA: 0,
        taxAmtB,
        taxAmtC: 0,
        taxAmtD: 0,
        taxAmtE: 0,
        totTaxblAmt,
        totTaxAmt,
        totAmt,
        prchrAcptcYn: "N" as const,
        remark: remark?.trim() || null,
        regrId: "Admin",
        regrNm: "Admin",
        modrId: "Admin",
        modrNm: "Admin",
        receipt: {
            custTin: sale.custTin ?? null,
            rcptPbctDt: dt14,
            prchrAcptcYn: "N" as const,
        },
        itemList: mappedLines.length ? mappedLines : [{
            itemSeq: 1,
            itemCd: "KE3OUXU0000001",
            itemNm: "Credit adjustment",
            pkgUnitCd: "OU",
            pkg: 1,
            qtyUnitCd: "U",
            qty: 1,
            prc: 0,
            splyAmt: 0,
            dcRt: 0,
            dcAmt: 0,
            taxTyCd: "B" as const,
            taxblAmt: 0,
            taxAmt: 0,
            totAmt: 0,
        }],
    };
}

export function IssueETimsCreditNoteSheet({
    open,
    onOpenChange,
    sale,
    availableSales = [],
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When set, credit note is issued against this sale (from row action). */
    sale?: EtimsSaleForCreditNote | null;
    /** Signed sales available for manual original-invoice selection. */
    availableSales?: EtimsSaleForCreditNote[];
    onSuccess?: () => void;
}) {
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [pendingSubmit, setPendingSubmit] = React.useState<FormData | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { orgInvcNo: "", rfdRsnCd: "06", remark: "" },
    });

    const orgInvcNo = form.watch("orgInvcNo");
    const effectiveSale = React.useMemo(() => {
        if (sale) return sale;
        return availableSales.find((s) => String(s.invcNo) === orgInvcNo) ?? null;
    }, [sale, availableSales, orgInvcNo]);

    React.useEffect(() => {
        if (!open) return;
        form.reset({
            orgInvcNo: sale ? String(sale.invcNo) : "",
            rfdRsnCd: "06",
            remark: "",
        });
    }, [open, sale, form]);

    const sendCreditNote = trpc.etims.sales.sendCreditNote.useMutation({
        onSuccess: (res) => {
            if (res?.success === false) {
                toast.error(res?.errorMessage ?? "Failed to issue credit note");
                return;
            }
            toast.success("Credit note issued to KRA eTIMS");
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => toast.error(err.message || "Failed to issue credit note"),
    });

    const submitCreditNote = (values: FormData) => {
        const source = sale ?? availableSales.find((s) => String(s.invcNo) === values.orgInvcNo);
        if (!source) {
            toast.error("Select the original invoice to credit");
            return;
        }
        sendCreditNote.mutate({
            transaction: buildCreditNotePayload(source, values.rfdRsnCd, values.remark),
        });
    };

    const onSubmit = (values: FormData) => {
        const source = sale ?? availableSales.find((s) => String(s.invcNo) === values.orgInvcNo);
        if (!source) {
            toast.error("Select the original invoice to credit");
            return;
        }
        setPendingSubmit(values);
        setConfirmOpen(true);
    };

    const pendingSource = pendingSubmit
        ? (sale ?? availableSales.find((s) => String(s.invcNo) === pendingSubmit.orgInvcNo) ?? null)
        : null;

    return (
        <>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Submit credit note to KRA?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                You are about to register a fiscal credit note against original invoice{" "}
                                <span className="font-mono font-semibold text-foreground">
                                    #{pendingSource?.invcNo ?? pendingSubmit?.orgInvcNo}
                                </span>
                                {pendingSource?.custNm ? (
                                    <>
                                        {" "}for{" "}
                                        <span className="font-semibold text-foreground">{pendingSource.custNm}</span>
                                    </>
                                ) : null}
                                .
                            </p>
                            {pendingSource ? (
                                <p>
                                    Amount:{" "}
                                    <span className="font-semibold text-foreground">
                                        {Number(pendingSource.displayAmount ?? 0).toLocaleString()} KES
                                    </span>
                                </p>
                            ) : null}
                            {pendingSubmit ? (
                                <p>
                                    Reason:{" "}
                                    <span className="font-semibold text-foreground">
                                        {creditNoteReasonLabel(pendingSubmit.rfdRsnCd)}
                                    </span>
                                </p>
                            ) : null}
                            <p>
                                This sends <code className="text-xs">/saveTrnsSalesOsdc</code> with{" "}
                                <code className="text-xs">rcptTyCd=R</code> to KRA eTIMS. The credit note is
                                recorded on KRA and will appear under Credit Notes once signed.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={sendCreditNote.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={sendCreditNote.isPending || !pendingSubmit}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!pendingSubmit) return;
                            submitCreditNote(pendingSubmit);
                            setConfirmOpen(false);
                            setPendingSubmit(null);
                        }}
                    >
                        {sendCreditNote.isPending ? (
                            <>
                                <Spinner size={16} className="mr-2" />
                                Submitting...
                            </>
                        ) : (
                            "Submit to KRA"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Issue credit note</SheetTitle>
                    <SheetDescription>
                        Submits to KRA via <code className="text-xs">/saveTrnsSalesOsdc</code> with{" "}
                        <code className="text-xs">rcptTyCd=R</code> against a signed sale.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        {!sale ? (
                            <FormField
                                control={form.control}
                                name="orgInvcNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Original invoice</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select signed sale to credit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableSales.map((s) => (
                                                    <SelectItem key={s.invcNo} value={String(s.invcNo)}>
                                                        #{s.invcNo}  {s.custNm ?? "Customer"} (
                                                        {Number(s.displayAmount ?? 0).toLocaleString()} KES)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : null}

                        {effectiveSale ? (
                            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                                <p className="font-medium">{effectiveSale.custNm ?? "Customer"}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                    Original invoice #{effectiveSale.invcNo}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Amount: {Number(effectiveSale.displayAmount ?? 0).toLocaleString()} KES
                                </p>
                            </div>
                        ) : null}

                        <FormField
                            control={form.control}
                            name="rfdRsnCd"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Credit note reason</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CREDIT_NOTE_REASONS.map((r) => (
                                                <SelectItem key={r.code} value={r.code}>
                                                    {r.code}  {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remark (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sendCreditNote.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={sendCreditNote.isPending || (!sale && !effectiveSale)}>
                                {sendCreditNote.isPending ? (
                                    <>
                                        <Spinner size={16} className="mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Issue credit note"
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
        </>
    );
}
