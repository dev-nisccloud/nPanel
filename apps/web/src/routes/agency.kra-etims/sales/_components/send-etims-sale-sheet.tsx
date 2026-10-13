"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Plus, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { ComboboxDropdown } from "@npanel/ui/components/combobox-dropdown";
import { captureEvent } from "@/lib/posthog";
import {
	AUDITOR,
	LAST_REQ_DT,
	PAYMENT_TYPES,
	TAX_TYPES,
	aggregateTaxBands,
	dateInputToKra8,
	isoDateInNairobi,
	kraDateTime14,
	kraResultError,
	lineAmountsFromInclusive,
	nextInvcNo,
	parseExpectedInvcNo,
	round2,
	taxRatePct,
	unwrapKraList,
	customerFromLookup,
	extractTaxpayerRow,
} from "../../_lib/etims-kra";
import {
	isFinishedProduct,
	isRawMaterial,
	isServiceItem,
	itemTypeLabel,
	type EtimsItemRecord,
} from "../../products/_components/etims-item-utils";

const lineSchema = z.object({
	itemCd: z.string().min(1, "Select an item"),
	itemNm: z.string().min(1, "Enter a name for this line").max(200),
	itemClsCd: z.string().min(1),
	pkgUnitCd: z.string().min(1),
	qtyUnitCd: z.string().min(1),
	taxTyCd: z.enum(["A", "B", "C", "D", "E"]),
	qty: z.coerce.number().positive("Qty must be greater than 0"),
	inclusivePrc: z.coerce.number().positive("Price must be greater than 0"),
	dcRt: z.coerce.number().min(0).max(100).default(0),
});

const formSchema = z.object({
	trdInvcNo: z.string().min(1, "Invoice number is required").max(50),
	invcNo: z.coerce.number().int().min(1),
	custTin: z.string().max(11).optional().or(z.literal("")),
	custNm: z.string().max(60).optional().or(z.literal("")),
	custMblNo: z.string().max(20).optional().or(z.literal("")),
	pmtTyCd: z.string().min(1),
	salesDt: z.string().min(1),
	remark: z.string().max(400).optional().or(z.literal("")),
	lines: z.array(lineSchema).min(1, "Add at least one line"),
});

type FormData = z.infer<typeof formSchema>;

type ItemOption = EtimsItemRecord & { id: string; label: string };

export function SendETimsSaleSheet({
	open,
	onOpenChange,
	onSuccess,
	tradeName,
	address,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	tradeName?: string | null;
	address?: string | null;
}) {
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: defaultForm(),
	});

	const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

	const { data: itemsData } = trpc.etims.items.getItemList.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: open },
	);
	const { data: customersData } = trpc.etims.data.getCustomerList.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: open },
	);
	const { data: salesData } = trpc.etims.sales.getSalesTransactions.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: open },
	);
	const { data: taxpayerData } = trpc.etims.data.getTaxPayerInfo.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: open },
	);

	const receiptIdentity = React.useMemo(() => {
		const row = extractTaxpayerRow(taxpayerData);
		const loc = [row.locDesc, row.sctrNm, row.dstrtNm, row.prvncNm].filter(Boolean).join(", ");
		return {
			tradeName: String(tradeName ?? row.taxprNm ?? row.bhfNm ?? "nPanel"),
			address: String(address ?? (loc || "Nairobi")),
		};
	}, [taxpayerData, tradeName, address]);

	const itemOptions = React.useMemo((): ItemOption[] => {
		const list = unwrapKraList(itemsData, "itemList", "items") as EtimsItemRecord[];
		const pool = list.filter((it) => it.useYn !== "N" && it.itemCd);
		return pool.map((it) => {
			const type =
				itemTypeLabel(it.itemTyCd)
				|| (isServiceItem(it) ? "Service" : isFinishedProduct(it) ? "Finished product" : isRawMaterial(it) ? "Raw material" : "Item");
			return {
				...it,
				id: String(it.itemCd),
				label: `${type} · ${it.itemNm} (${it.itemCd})`,
			};
		});
	}, [itemsData]);

	const customerOptions = React.useMemo(() => {
		const list = unwrapKraList(customersData, "custList", "customerList");
		const fromQuery = Array.isArray((customersData as { data?: unknown })?.data)
			? ((customersData as { data: Record<string, unknown>[] }).data)
			: list;
		return fromQuery
			.filter((c) => c.useYn !== "N")
			.map((c) => ({
				id: String(c.custTin ?? c.custNo ?? ""),
				label: `${c.custNm ?? "Customer"} (${c.custTin ?? c.custNo ?? ""})`,
				custTin: String(c.custTin ?? ""),
				custNm: String(c.custNm ?? ""),
				telNo: String(c.telNo ?? ""),
			}))
			.filter((c) => c.id);
	}, [customersData]);

	const suggestedInvcNo = React.useMemo(() => {
		const list = unwrapKraList(salesData, "salesList", "saleList", "itemList");
		return nextInvcNo(list);
	}, [salesData]);

	React.useEffect(() => {
		if (!open) return;
		form.reset({
			...defaultForm(),
			invcNo: suggestedInvcNo,
			trdInvcNo: `TINV${suggestedInvcNo}`,
		});
		setLookupTin(null);
		setTinSearch("");
	}, [open, suggestedInvcNo, form]);

	const [tinSearch, setTinSearch] = React.useState("");
	const [lookupTin, setLookupTin] = React.useState<string | null>(null);
	const { data: lookupData, isFetching: isLookingUp } = trpc.etims.data.lookupCustomer.useQuery(
		{ custmTin: lookupTin ?? "" },
		{ enabled: !!lookupTin, retry: false },
	);

	React.useEffect(() => {
		if (!lookupTin || isLookingUp) return;
		const found = customerFromLookup(lookupData);
		if (!found) {
			if (lookupData !== undefined) {
				toast.error("KRA did not return details for this PIN");
			}
			return;
		}
		form.setValue("custNm", found.name);
		form.setValue("custTin", found.tin || lookupTin);
		if (found.telNo) form.setValue("custMblNo", found.telNo);
		toast.success(`Customer verified: ${found.name}`);
		setLookupTin(null);
	}, [lookupData, lookupTin, isLookingUp, form]);

	const sendSale = trpc.etims.sales.sendSalesTransaction.useMutation();

	const watchedLines = useWatch({ control: form.control, name: "lines" }) ?? [];
	const lineAmounts = React.useMemo(
		() =>
			watchedLines.map((line) =>
				lineAmountsFromInclusive({
					inclusiveUnitPrice: Number(line.inclusivePrc) || 0,
					qty: Number(line.qty) || 0,
					taxTyCd: line.taxTyCd ?? "B",
					dcRt: Number(line.dcRt) || 0,
				}),
			),
		[watchedLines],
	);
	const totals = React.useMemo(
		() =>
			aggregateTaxBands(
				lineAmounts.map((m, i) => ({
					taxTyCd: watchedLines[i]?.taxTyCd ?? "B",
					taxblAmt: m.taxblAmt,
					taxAmt: m.taxAmt,
					totAmt: m.totAmt,
				})),
			),
		[lineAmounts, watchedLines],
	);
	const vatLabel =
		totals.taxAmtE > 0 && totals.taxAmtB <= 0
			? "VAT (8%)"
			: totals.taxAmtB > 0 && totals.taxAmtE <= 0
				? "VAT (16%)"
				: "VAT";

	const applyItem = (index: number, item: ItemOption) => {
		const opts = { shouldDirty: true, shouldTouch: true } as const;
		form.setValue(`lines.${index}.itemCd`, item.itemCd, opts);
		form.setValue(`lines.${index}.itemNm`, item.itemNm, opts);
		form.setValue(`lines.${index}.itemClsCd`, item.itemClsCd, opts);
		form.setValue(`lines.${index}.pkgUnitCd`, item.pkgUnitCd ?? "OU", opts);
		form.setValue(`lines.${index}.qtyUnitCd`, item.qtyUnitCd ?? "NO", opts);
		form.setValue(
			`lines.${index}.taxTyCd`,
			(item.taxTyCd as FormData["lines"][number]["taxTyCd"]) ?? "B",
			opts,
		);
		const price = Number(item.dftPrc ?? 0);
		if (price > 0) form.setValue(`lines.${index}.inclusivePrc`, round2(price), opts);
	};

	const buildPayload = (data: FormData, invcNo: number) => {
		const salesDt = dateInputToKra8(data.salesDt);
		const cfmDt = kraDateTime14();
		const itemList = data.lines.map((line, idx) => {
			const amts = lineAmountsFromInclusive({
				inclusiveUnitPrice: line.inclusivePrc,
				qty: line.qty,
				taxTyCd: line.taxTyCd,
				dcRt: line.dcRt,
			});
			return {
				itemSeq: idx + 1,
				itemCd: line.itemCd,
				itemClsCd: line.itemClsCd,
				itemNm: line.itemNm,
				pkgUnitCd: line.pkgUnitCd,
				pkg: 1,
				qtyUnitCd: line.qtyUnitCd,
				qty: amts.qty,
				prc: amts.prc,
				splyAmt: amts.splyAmt,
				dcRt: amts.dcRt,
				dcAmt: amts.dcAmt,
				taxTyCd: line.taxTyCd,
				taxblAmt: amts.taxblAmt,
				taxAmt: amts.taxAmt,
				totAmt: amts.totAmt,
			};
		});
		const bands = aggregateTaxBands(itemList);
		const custTin = data.custTin?.trim() || null;
		const custNm = data.custNm?.trim() || null;
		const hasGoods = data.lines.some((line) => {
			const item = itemOptions.find((it) => it.itemCd === line.itemCd);
			return item ? !isServiceItem(item) : !/^[A-Z]{2}3/.test(line.itemCd);
		});
		return {
			trdInvcNo: data.trdInvcNo.trim(),
			invcNo,
			orgInvcNo: 0,
			custTin,
			custNm,
			salesTyCd: "N",
			rcptTyCd: "S",
			pmtTyCd: data.pmtTyCd,
			salesSttsCd: "02",
			cfmDt,
			salesDt,
			stockRlsDt: hasGoods ? cfmDt : null,
			totItemCnt: itemList.length,
			...bands,
			prchrAcptcYn: "N" as const,
			remark: data.remark?.trim() || null,
			...AUDITOR,
			receipt: {
				custTin,
				custMblNo: data.custMblNo?.trim() || null,
				rcptPbctDt: cfmDt,
				trdeNm: receiptIdentity.tradeName.slice(0, 20),
				adrs: receiptIdentity.address.slice(0, 200),
				prchrAcptcYn: "N" as const,
			},
			itemList,
		};
	};

	const onSubmit = async (data: FormData) => {
		let invcNo = data.invcNo;
		for (let attempt = 0; attempt < 4; attempt++) {
			const payload = buildPayload(data, invcNo);
			const res = await sendSale.mutateAsync({ transaction: payload });
			const err = kraResultError(res);
			if (!err) {
				captureEvent("etims_sale_recorded", { has_vat: true, service: true });
				toast.success("Sale sent to KRA eTIMS");
				onOpenChange(false);
				onSuccess?.();
				return;
			}
			const expected = parseExpectedInvcNo(err);
			if (expected && expected !== invcNo) {
				invcNo = expected;
				form.setValue("invcNo", expected);
				toast.message(`KRA expected invoice ${expected}. Retrying…`);
				continue;
			}
			toast.error(err);
			return;
		}
		toast.error("Could not allocate the next KRA invoice number");
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent size="wide" className="w-full min-w-0 overflow-x-hidden overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Record sale</SheetTitle>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6 min-w-0">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-4 min-w-0">
							<FormField
								control={form.control}
								name="trdInvcNo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Trader invoice #</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="invcNo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>KRA invcNo</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="salesDt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sale date</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="pmtTyCd"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payment</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full min-w-0">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{PAYMENT_TYPES.map((p) => (
													<SelectItem key={p.code} value={p.code}>
														{p.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-3">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="custTin"
									render={({ field }) => (
										<FormItem>
											<FormLabel>PIN (optional for cash)</FormLabel>
											<ComboboxDropdown
												inDialog
												placeholder="Select saved customer…"
												searchPlaceholder="Search PIN or name…"
												items={customerOptions}
												selectedItem={customerOptions.find((c) => c.custTin === field.value)}
												onSelect={(item) => {
													field.onChange(item.custTin);
													form.setValue("custNm", item.custNm);
													if (item.telNo) form.setValue("custMblNo", item.telNo);
												}}
											/>
											<FormControl>
												<Input className="mt-2 font-mono uppercase" placeholder="Or type PIN" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="custNm"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="flex gap-2">
								<Input
									placeholder="Verify PIN with KRA…"
									value={tinSearch}
									onChange={(e) => setTinSearch(e.target.value)}
									className="font-mono uppercase"
								/>
								<Button
									type="button"
									variant="secondary"
									disabled={isLookingUp || tinSearch.trim().length < 8}
									onClick={() => setLookupTin(tinSearch.trim().toUpperCase())}
								>
									{isLookingUp ? <Spinner size={14} className="mr-2" /> : <Search className="mr-2 h-4 w-4" />}
									Verify
								</Button>
							</div>
							<FormField
								control={form.control}
								name="custMblNo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mobile (receipt)</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lines</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											itemCd: "",
											itemNm: "",
											itemClsCd: "",
											pkgUnitCd: "OU",
											qtyUnitCd: "NO",
											taxTyCd: "B",
											qty: 1,
											inclusivePrc: 0,
											dcRt: 0,
										})
									}
								>
									<Plus className="mr-1 h-4 w-4" />
									Add line
								</Button>
							</div>
							{fields.map((field, index) => {
								const line = watchedLines[index];
								const selected = itemOptions.find((it) => it.id === line?.itemCd);
								const amts = lineAmounts[index] ?? lineAmountsFromInclusive({
									inclusiveUnitPrice: Number(line?.inclusivePrc) || 0,
									qty: Number(line?.qty) || 0,
									taxTyCd: line?.taxTyCd ?? "B",
									dcRt: Number(line?.dcRt) || 0,
								});
								return (
									<div key={field.id} className="rounded-xl border p-4 space-y-3">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<FormField
													control={form.control}
													name={`lines.${index}.itemCd`}
													render={() => (
														<FormItem>
															<FormLabel>Item</FormLabel>
															<ComboboxDropdown
																inDialog
																placeholder="Select product or service…"
																searchPlaceholder="Search item code or name…"
																items={itemOptions}
																selectedItem={selected}
																onSelect={(item) => applyItem(index, item)}
																emptyResults="No items registered. Add one under Products first."
															/>
															{selected?.itemCd ? (
																<p className="text-[11px] text-muted-foreground">
																	KRA item code stays <span className="font-mono">{selected.itemCd}</span>
																</p>
															) : null}
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name={`lines.${index}.itemNm`}
													render={({ field: nameField }) => (
														<FormItem className="mt-3">
															<FormLabel>Name on receipt</FormLabel>
															<FormControl>
																<Input
																	{...nameField}
																	disabled={!selected}
																	placeholder={selected ? "Edit the name shown on this sale…" : "Select a service first"}
																	maxLength={200}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											{fields.length > 1 ? (
												<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											) : null}
										</div>
										<div className="grid grid-cols-2 gap-3 min-w-0">
											<FormField
												control={form.control}
												name={`lines.${index}.qty`}
												render={({ field: qtyField }) => (
													<FormItem className="min-w-0">
														<FormLabel>Qty</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...qtyField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.inclusivePrc`}
												render={({ field: prcField }) => (
													<FormItem className="min-w-0">
														<FormLabel>Unit price (incl. VAT)</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...prcField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.dcRt`}
												render={({ field: dcField }) => (
													<FormItem className="min-w-0">
														<FormLabel>Discount %</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...dcField} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.taxTyCd`}
												render={({ field: taxField }) => (
													<FormItem className="min-w-0">
														<FormLabel>Tax</FormLabel>
														<Select value={taxField.value} onValueChange={taxField.onChange}>
															<FormControl>
																<SelectTrigger className="w-full min-w-0">
																	<SelectValue />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{TAX_TYPES.map((t) => (
																	<SelectItem key={t.code} value={t.code}>
																		{t.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<p className="text-xs text-muted-foreground">
											Taxable {amts.taxblAmt.toFixed(2)} · VAT {amts.taxAmt.toFixed(2)} ({taxRatePct(line?.taxTyCd ?? "B")}%) · Line total {amts.totAmt.toFixed(2)}
										</p>
									</div>
								);
							})}
						</div>

						<FormField
							control={form.control}
							name="remark"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Remark</FormLabel>
									<FormControl>
										<Textarea rows={2} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="rounded-xl border bg-muted/20 p-4 text-sm space-y-1">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Taxable</span>
								<span>{totals.totTaxblAmt.toFixed(2)} KES</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">{vatLabel}</span>
								<span>{totals.totTaxAmt.toFixed(2)} KES</span>
							</div>
							<div className="flex justify-between font-semibold">
								<span>Total (incl. VAT)</span>
								<span>{totals.totAmt.toFixed(2)} KES</span>
							</div>
						</div>

						<SheetFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sendSale.isPending}>
								Cancel
							</Button>
							<Button type="submit" disabled={sendSale.isPending || itemOptions.length === 0}>
								{sendSale.isPending ? (
									<>
										<Spinner size={16} className="mr-2" />
										Creating…
									</>
								) : (
									"Create sale"
								)}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

function defaultForm(): FormData {
	return {
		trdInvcNo: "TINV1",
		invcNo: 1,
		custTin: "",
		custNm: "",
		custMblNo: "",
		pmtTyCd: "01",
		salesDt: isoDateInNairobi(),
		remark: "",
		lines: [
			{
				itemCd: "",
				itemNm: "",
				itemClsCd: "",
				pkgUnitCd: "OU",
				qtyUnitCd: "NO",
				taxTyCd: "B",
				qty: 1,
				inclusivePrc: 0,
				dcRt: 0,
			},
		],
	};
}
