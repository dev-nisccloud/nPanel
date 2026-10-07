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
import {
    AUDITOR,
    aggregateTaxBands,
    kraDate8,
    kraDateTime14,
    kraResultError,
    lineAmountsFromInclusive,
    parseExpectedInvcNo,
    round2,
} from "../../_lib/etims-kra";
import {
    mergeEtimsSaleWithDetails,
    unwrapEtimsInvoiceDetails,
} from "@npanel/api/agency-invoice-pdf/etims-sale-to-invoice-detail";

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

function qtyUnitForKra(code?: unknown) {
    const raw = String(code ?? "NO").trim() || "NO";
    return raw === "U" ? "NO" : raw;
}

function mapCreditLine(line: Record<string, unknown>, idx: number) {
    const taxTyCd = String(line.taxTyCd ?? "B");
    const qty = Number(line.qty ?? 1) > 0 ? Number(line.qty ?? 1) : 1;
    const copiedTaxbl = round2(Number(line.taxblAmt ?? 0));
    const copiedTax = round2(Number(line.taxAmt ?? 0));
    const copiedTot = round2(Number(line.totAmt ?? 0));
    const inclusive =
        round2(Number(line.prc ?? 0)) ||
        (copiedTot > 0 ? round2(copiedTot / qty) : 0) ||
        round2(Number(line.splyAmt ?? 0) / qty);
    const amts = lineAmountsFromInclusive({
        inclusiveUnitPrice: inclusive,
        qty,
        taxTyCd,
        dcRt: Number(line.dcRt ?? 0),
    });
    const useCopied = copiedTaxbl > 0 || copiedTot > 0;
    return {
        itemSeq: idx + 1,
        itemCd: String(line.itemCd ?? ""),
        itemClsCd: line.itemClsCd ? String(line.itemClsCd) : undefined,
        itemNm: String(line.itemNm ?? "Item"),
        pkgUnitCd: String(line.pkgUnitCd ?? "OU"),
        pkg: 1,
        qtyUnitCd: qtyUnitForKra(line.qtyUnitCd),
        qty: round2(qty),
        prc: useCopied ? round2(Number(line.prc ?? inclusive)) : amts.prc,
        splyAmt: useCopied ? round2(Number(line.splyAmt ?? (copiedTot || copiedTaxbl))) : amts.splyAmt,
        dcRt: round2(Number(line.dcRt ?? 0)),
        dcAmt: round2(Number(line.dcAmt ?? 0)),
        taxTyCd,
        taxblAmt: useCopied ? copiedTaxbl || round2(copiedTot - copiedTax) : amts.taxblAmt,
        taxAmt: useCopied ? copiedTax : amts.taxAmt,
        totAmt: useCopied ? copiedTot || round2(copiedTaxbl + copiedTax) : amts.totAmt,
    };
}

export function buildCreditNotePayload(
    sale: EtimsSaleForCreditNote,
    rfdRsnCd: FormData["rfdRsnCd"],
    remark?: string,
    invcNo = 1,
) {
    const salesDt = kraDate8();
    const dt14 = kraDateTime14();
    const lines = Array.isArray(sale.itemList) ? sale.itemList : [];
    const mappedLines = lines.map((line, idx) => mapCreditLine(line, idx));
    const itemList = mappedLines.length
        ? mappedLines
        : [{
            itemSeq: 1,
            itemCd: "KE3OUNO0000001",
            itemNm: "Credit adjustment",
            pkgUnitCd: "OU",
            pkg: 1,
            qtyUnitCd: "NO",
            qty: 1,
            prc: 0,
            splyAmt: 0,
            dcRt: 0,
            dcAmt: 0,
            taxTyCd: "B" as const,
            taxblAmt: 0,
            taxAmt: 0,
            totAmt: 0,
        }];
    const bands = aggregateTaxBands(itemList);

    return {
        trdInvcNo: `CN${invcNo}`,
        invcNo,
        orgInvcNo: sale.invcNo,
        custTin: sale.custTin ?? null,
        custNm: sale.custNm ?? null,
        salesTyCd: "N",
        rcptTyCd: "R" as const,
        pmtTyCd: sale.pmtTyCd ?? "01",
        salesSttsCd: "02",
        cfmDt: dt14,
        salesDt,
        stockRlsDt: null,
        rfdDt: dt14,
        rfdRsnCd,
        totItemCnt: itemList.length,
        ...bands,
        prchrAcptcYn: "N" as const,
        remark: remark?.trim() || null,
        ...AUDITOR,
        receipt: {
            custTin: sale.custTin ?? null,
            rcptPbctDt: dt14,
            prchrAcptcYn: "N" as const,
        },
        itemList,
    };
}

export function IssueETimsCreditNoteSheet({
    open,
    onOpenChange,
    sale,
    availableSales = [],
    nextInvcNo = 1,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When set, credit note is issued against this sale (from row action). */
    sale?: EtimsSaleForCreditNote | null;
    /** Signed sales available for manual original-invoice selection. */
    availableSales?: EtimsSaleForCreditNote[];
    nextInvcNo?: number;
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

    const utils = trpc.useUtils();
    const sendCreditNote = trpc.etims.sales.sendCreditNote.useMutation();

    const resolveSaleLines = async (source: EtimsSaleForCreditNote): Promise<EtimsSaleForCreditNote> => {
        if (Array.isArray(source.itemList) && source.itemList.length > 0) return source;
        try {
            const detailsRes = await utils.etims.sales.getInvoiceDetails.fetch({ invcNo: source.invcNo });
            const merged = mergeEtimsSaleWithDetails(source, unwrapEtimsInvoiceDetails(detailsRes));
            const itemList = Array.isArray(merged.itemList) ? merged.itemList : [];
            return { ...source, itemList };
        } catch {
            return source;
        }
    };

    const submitCreditNote = async (values: FormData) => {
        const source = sale ?? availableSales.find((s) => String(s.invcNo) === values.orgInvcNo);
        if (!source) {
            toast.error("Select the original invoice to credit");
            return;
        }
        const resolved = await resolveSaleLines(source);
        let invcNo = nextInvcNo;
        try {
            for (let attempt = 0; attempt < 4; attempt++) {
                const res = await sendCreditNote.mutateAsync({
                    transaction: buildCreditNotePayload(resolved, values.rfdRsnCd, values.remark, invcNo),
                });
                const err = res?.success === false
                    ? (res.errorMessage ?? "Failed to issue credit note")
                    : kraResultError(res);
                if (!err) {
                    toast.success("Credit note issued");
                    onOpenChange(false);
                    onSuccess?.();
                    return;
                }
                const expected = parseExpectedInvcNo(err);
                if (expected && expected !== invcNo) {
                    invcNo = expected;
                    toast.message(`KRA expected invoice ${expected}. Retrying…`);
                    continue;
                }
                toast.error(err);
                return;
            }
            toast.error("Could not allocate the next KRA invoice number");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to issue credit note");
        }
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
                    <AlertDialogTitle>Issue credit note?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Reverse invoice #{pendingSource?.invcNo ?? pendingSubmit?.orgInvcNo}
                        {pendingSource?.displayAmount != null
                            ? ` (${Number(pendingSource.displayAmount).toLocaleString()} KES)`
                            : ""}
                        {pendingSubmit ? ` as ${creditNoteReasonLabel(pendingSubmit.rfdRsnCd).toLowerCase()}` : ""}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={sendCreditNote.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={sendCreditNote.isPending || !pendingSubmit}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!pendingSubmit) return;
                            const values = pendingSubmit;
                            setConfirmOpen(false);
                            setPendingSubmit(null);
                            void submitCreditNote(values);
                        }}
                    >
                        {sendCreditNote.isPending ? (
                            <>
                                <Spinner size={16} className="mr-2" />
                                Issuing…
                            </>
                        ) : (
                            "Issue credit note"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Issue credit note</SheetTitle>
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
                                        Issuing…
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
