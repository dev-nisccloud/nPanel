"use client";

import * as React from "react";
import { ExternalLink, FileMinus, User, Receipt, Calculator } from "lucide-react";
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
import {
    type EtimsSaleRecord,
    creditNoteReason,
    formatKraDateTime,
    formatMoney,
    formatSalesDate,
    isCreditNote,
    lineDisplayAmount,
    lineTaxableAmount,
    paymentTypeLabel,
    receiptTypeLabel,
    sumLineItems,
    taxBandRows,
} from "./etims-sale-utils";

function InfoGrid({ rows }: { rows: Array<{ label: string; value: React.ReactNode; mono?: boolean }> }) {
    return (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {rows.map((row) => (
                <div key={row.label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className={`mt-0.5 font-medium break-words ${row.mono ? "font-mono text-xs" : ""}`}>
                        {row.value ?? "—"}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function ViewETimsSaleSheet({
    open,
    onOpenChange,
    sale,
    onVerifyKra,
    onIssueCreditNote,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: EtimsSaleRecord | null;
    onVerifyKra?: (sale: EtimsSaleRecord) => void;
    onIssueCreditNote?: (sale: EtimsSaleRecord) => void;
}) {
    if (!sale) return null;

    const creditNote = isCreditNote(sale);
    const receipt = (sale.receipt ?? {}) as Record<string, unknown>;
    const itemList = Array.isArray(sale.itemList) ? sale.itemList : [];
    const lineSums = sumLineItems(itemList);
    const bands = taxBandRows(sale);

    const headerTaxbl = Number(sale.totTaxblAmt ?? 0);
    const headerTax = Number(sale.totTaxAmt ?? 0);
    const headerTot = Number(sale.totAmt ?? 0);
    const displayTotal = Number(sale.displayAmount ?? 0) || headerTot || headerTaxbl + headerTax || lineSums.total;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">
                                {creditNote ? `Credit note #${sale.invcNo}` : `Sale #${sale.invcNo}`}
                            </SheetTitle>
                            <SheetDescription>
                                {creditNote
                                    ? `Credit against original invoice #${sale.orgInvcNo ?? "—"}`
                                    : "KRA eTIMS signed sale record"}
                            </SheetDescription>
                        </div>
                        <Badge
                            className={
                                creditNote
                                    ? "shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                                    : "shrink-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                            }
                        >
                            {creditNote ? "CREDIT NOTE" : "SIGNED"}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <section className="rounded-lg border p-4 space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Customer
                        </h4>
                        <InfoGrid
                            rows={[
                                { label: "Customer name", value: sale.custNm ?? "Cash Sale" },
                                { label: "Customer TIN", value: sale.custTin, mono: true },
                            ]}
                        />
                    </section>

                    <section className="rounded-lg border p-4 space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            Transaction
                        </h4>
                        <InfoGrid
                            rows={[
                                { label: "Invoice number", value: `#${sale.invcNo}`, mono: true },
                                ...(creditNote
                                    ? [
                                        { label: "Original invoice", value: `#${sale.orgInvcNo ?? "—"}`, mono: true },
                                        { label: "Credit reason", value: creditNoteReason(sale) },
                                        { label: "Refund date", value: formatKraDateTime(sale.rfdDt) },
                                    ]
                                    : [{ label: "Original invoice", value: sale.orgInvcNo ? `#${sale.orgInvcNo}` : "—", mono: true }]),
                                { label: "Receipt type", value: receiptTypeLabel(sale.rcptTyCd) },
                                { label: "Payment method", value: paymentTypeLabel(sale.pmtTyCd) },
                                { label: "Status code", value: sale.salesSttsCd, mono: true },
                                { label: "Sales date", value: formatSalesDate(sale.salesDt) },
                                { label: "Confirmed at", value: formatKraDateTime(sale.cfmDt) },
                                { label: "Stock released", value: formatKraDateTime(sale.stockRlsDt) },
                                { label: "Purchase accepted", value: sale.prchrAcptcYn ?? receipt.prchrAcptcYn ?? "—" },
                                { label: "Item count", value: sale.totItemCnt ?? itemList.length },
                                ...(sale.remark ? [{ label: "Remark", value: sale.remark }] : []),
                            ]}
                        />
                    </section>

                    <section className="rounded-lg border p-4 space-y-3">
                        <h4 className="text-sm font-medium">KRA fiscal receipt</h4>
                        <InfoGrid
                            rows={[
                                { label: "Receipt signature", value: sale.displayKraRef ?? receipt.rcptSign, mono: true },
                                { label: "Internal data", value: receipt.intrlData, mono: true },
                                { label: "Receipt number", value: sale.displayRcptNo ?? receipt.curRcptNo, mono: true },
                                { label: "Total receipts", value: receipt.totRcptNo, mono: true },
                                { label: "Published at", value: formatKraDateTime(receipt.rcptPbctDt as string) },
                                { label: "SCU date/time", value: formatKraDateTime(receipt.sdcDateTime as string) },
                                { label: "Trader name", value: receipt.trdeNm },
                                { label: "Report number", value: receipt.rptNo },
                                { label: "Top message", value: receipt.topMsg },
                                { label: "Bottom message", value: receipt.btmMsg },
                            ]}
                        />
                    </section>

                    <section className="rounded-lg border overflow-hidden">
                        <div className="px-4 py-3 border-b bg-muted/30">
                            <h4 className="text-sm font-medium">Line items</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">#</th>
                                        <th className="px-4 py-2 text-left font-medium">Item</th>
                                        <th className="px-4 py-2 text-right font-medium">Qty</th>
                                        <th className="px-4 py-2 text-right font-medium">Unit price</th>
                                        <th className="px-4 py-2 text-right font-medium">Taxable</th>
                                        <th className="px-4 py-2 text-right font-medium">Tax</th>
                                        <th className="px-4 py-2 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {itemList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-xs">
                                                No line items returned by KRA for this record.
                                            </td>
                                        </tr>
                                    ) : (
                                        itemList.map((line, idx) => (
                                            <tr key={`${line.itemSeq ?? idx}-${line.itemCd ?? idx}`}>
                                                <td className="px-4 py-3 text-muted-foreground">{line.itemSeq ?? idx + 1}</td>
                                                <td className="px-4 py-3 min-w-[160px]">
                                                    <div className="font-medium">{String(line.itemNm ?? "Item")}</div>
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        {String(line.itemCd ?? "")}
                                                        {line.itemClsCd ? ` · ${String(line.itemClsCd)}` : ""}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Tax {String(line.taxTyCd ?? "—")} · {String(line.qtyUnitCd ?? "U")} × {String(line.pkgUnitCd ?? "OU")}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{Number(line.qty ?? 0)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(line.prc ?? 0))}</td>
                                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(lineTaxableAmount(line))}</td>
                                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(line.taxAmt ?? 0))}</td>
                                                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatMoney(lineDisplayAmount(line))}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {itemList.length > 0 ? (
                                    <tfoot className="border-t bg-muted/20 text-sm font-medium">
                                        <tr>
                                            <td className="px-4 py-3" colSpan={2}>Line totals</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{lineSums.qty}</td>
                                            <td className="px-4 py-3" />
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(lineSums.taxbl)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(lineSums.tax)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(lineSums.total)}</td>
                                        </tr>
                                    </tfoot>
                                ) : null}
                            </table>
                        </div>
                    </section>

                    <section className="rounded-lg border p-4 space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            Tax breakdown
                        </h4>
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground bg-muted/30 border-b">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Band</th>
                                        <th className="px-3 py-2 text-right font-medium">Taxable amount</th>
                                        <th className="px-3 py-2 text-right font-medium">Rate %</th>
                                        <th className="px-3 py-2 text-right font-medium">Tax amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {bands.map((row) => (
                                        <tr key={row.band}>
                                            <td className="px-3 py-2 font-mono">{row.band}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.taxbl)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{row.rate}%</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.tax)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t bg-muted/20 font-medium">
                                    <tr>
                                        <td className="px-3 py-2">Header totals</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(headerTaxbl || lineSums.taxbl)}</td>
                                        <td className="px-3 py-2" />
                                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(headerTax || lineSums.tax)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-muted/20 px-4 py-3">
                            <span className="text-sm font-medium">Grand total</span>
                            <span className="text-lg font-semibold tabular-nums">{formatMoney(displayTotal)}</span>
                        </div>
                        {(headerTot > 0 || headerTaxbl > 0) && lineSums.total > 0 && Math.abs(displayTotal - lineSums.total) > 0.01 ? (
                            <p className="text-xs text-muted-foreground">
                                KRA header total: {formatMoney(headerTot || headerTaxbl + headerTax)} · Line sum: {formatMoney(lineSums.total)}
                            </p>
                        ) : null}
                    </section>
                </div>

                <SheetFooter className="mt-8 flex-col gap-2 sm:flex-row sm:justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {!creditNote && onIssueCreditNote ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    onOpenChange(false);
                                    onIssueCreditNote(sale);
                                }}
                            >
                                <FileMinus className="mr-2 h-4 w-4" />
                                Issue credit note
                            </Button>
                        ) : null}
                    </div>
                    {onVerifyKra && sale.rcptSign ? (
                        <Button
                            type="button"
                            className="w-full sm:w-auto sm:ml-auto"
                            variant="outline"
                            onClick={() => onVerifyKra(sale)}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Verify on KRA Portal
                        </Button>
                    ) : null}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
