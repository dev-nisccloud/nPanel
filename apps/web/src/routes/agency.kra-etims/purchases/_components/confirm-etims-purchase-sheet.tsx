"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
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
	unwrapKraList,
} from "../../_lib/etims-kra";
import { type EtimsItemRecord } from "../../products/_components/etims-item-utils";

const lineSchema = z.object({
	itemCd: z.string().min(1, "Item code is required"),
	itemNm: z.string().min(1, "Item name is required"),
	itemClsCd: z.string().min(1, "Classification is required"),
	pkgUnitCd: z.string().min(1),
	qtyUnitCd: z.string().min(1),
	taxTyCd: z.string().min(1),
	qty: z.coerce.number().positive(),
	inclusivePrc: z.coerce.number().positive(),
	dcRt: z.coerce.number().min(0).max(100).default(0),
	spplrItemCd: z.string().optional().or(z.literal("")),
	spplrItemNm: z.string().optional().or(z.literal("")),
});

const formSchema = z.object({
	spplrTin: z.string().min(1, "Supplier PIN is required").max(11),
	spplrNm: z.string().min(1, "Supplier name is required").max(60),
	spplrBhfId: z.string().min(1).max(2),
	spplrInvcNo: z.coerce.number().int().min(1, "Supplier invoice number is required"),
	invcNo: z.coerce.number().int().min(1),
	pmtTyCd: z.string().min(1),
	pchsDt: z.string().min(1),
	remark: z.string().max(400).optional().or(z.literal("")),
	lines: z.array(lineSchema).min(1),
});

type FormData = z.infer<typeof formSchema>;

export type MirroredPurchase = Record<string, unknown>;

type ItemOption = EtimsItemRecord & { id: string; label: string };

export function ConfirmETimsPurchaseSheet({
	open,
	onOpenChange,
	onSuccess,
	mirrored,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	mirrored?: MirroredPurchase | null;
}) {
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: emptyForm(),
	});
	const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

	const { data: itemsData } = trpc.etims.items.getItemList.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: open },
	);
	const { data: purchasesData } = trpc.etims.purchases.getPurchaseTransactions.useQuery(
		{ lastReqDt: LAST_REQ_DT },
		{ enabled: open },
	);

	const itemOptions = React.useMemo((): ItemOption[] => {
		const list = unwrapKraList(itemsData, "itemList", "items") as EtimsItemRecord[];
		return list
			.filter((it) => it.useYn !== "N" && it.itemCd)
			.map((it) => ({
				...it,
				id: String(it.itemCd),
				label: `${it.itemNm} (${it.itemCd})`,
			}));
	}, [itemsData]);

	const suggestedInvcNo = React.useMemo(() => {
		const list = unwrapKraList(purchasesData, "saleList", "purchaseList", "itemList");
		const own = list.filter((row) => row.pchsDt || row.regTyCd === "M");
		return nextInvcNo(own);
	}, [purchasesData]);

	React.useEffect(() => {
		if (!open) return;
		form.reset(formFromMirrored(mirrored, suggestedInvcNo));
	}, [open, mirrored, suggestedInvcNo, form]);

	const sendPurchase = trpc.etims.purchases.sendPurchaseTransaction.useMutation();
	const watchedLines = form.watch("lines");
	const totals = React.useMemo(() => {
		const mapped = (watchedLines ?? []).map((line) =>
			lineAmountsFromInclusive({
				inclusiveUnitPrice: Number(line.inclusivePrc) || 0,
				qty: Number(line.qty) || 0,
				taxTyCd: line.taxTyCd,
				dcRt: Number(line.dcRt) || 0,
			}),
		);
		return aggregateTaxBands(
			mapped.map((m, i) => ({
				taxTyCd: watchedLines?.[i]?.taxTyCd ?? "B",
				taxblAmt: m.taxblAmt,
				taxAmt: m.taxAmt,
				totAmt: m.totAmt,
			})),
		);
	}, [watchedLines]);

	const applyItem = (index: number, item: ItemOption) => {
		form.setValue(`lines.${index}.itemCd`, item.itemCd);
		form.setValue(`lines.${index}.itemNm`, item.itemNm);
		form.setValue(`lines.${index}.itemClsCd`, item.itemClsCd);
		form.setValue(`lines.${index}.pkgUnitCd`, item.pkgUnitCd ?? "NT");
		form.setValue(`lines.${index}.qtyUnitCd`, item.qtyUnitCd ?? "U");
		form.setValue(`lines.${index}.taxTyCd`, item.taxTyCd ?? "B");
		const price = Number(item.dftPrc ?? 0);
		if (price > 0) form.setValue(`lines.${index}.inclusivePrc`, round2(price));
	};

	const buildPayload = (data: FormData, invcNo: number) => {
		const pchsDt = dateInputToKra8(data.pchsDt);
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
				bcd: null,
				spplrItemClsCd: line.itemClsCd,
				spplrItemCd: line.spplrItemCd?.trim() || line.itemCd,
				spplrItemNm: line.spplrItemNm?.trim() || line.itemNm,
				pkgUnitCd: line.pkgUnitCd,
				pkg: 1,
				qtyUnitCd: line.qtyUnitCd,
				qty: amts.qty,
				prc: amts.prc,
				splyAmt: amts.splyAmt,
				dcRt: amts.dcRt,
				dcAmt: amts.dcAmt,
				taxblAmt: amts.taxblAmt,
				taxTyCd: line.taxTyCd,
				taxAmt: amts.taxAmt,
				totAmt: amts.totAmt,
				itemExprDt: null,
			};
		});
		const bands = aggregateTaxBands(itemList);
		return {
			spplrTin: data.spplrTin.trim().toUpperCase(),
			invcNo,
			orgInvcNo: 0,
			spplrBhfId: data.spplrBhfId.trim() || "00",
			spplrNm: data.spplrNm.trim(),
			spplrInvcNo: data.spplrInvcNo,
			regTyCd: "M",
			pchsTyCd: "N",
			rcptTyCd: "P",
			pmtTyCd: data.pmtTyCd,
			pchsSttsCd: "02",
			cfmDt,
			pchsDt,
			wrhsDt: null,
			cnclReqDt: null,
			cnclDt: null,
			rfdDt: null,
			totItemCnt: itemList.length,
			...bands,
			remark: data.remark?.trim() || null,
			...AUDITOR,
			itemList,
		};
	};

	const onSubmit = async (data: FormData) => {
		let invcNo = data.invcNo;
		for (let attempt = 0; attempt < 4; attempt++) {
			const payload = buildPayload(data, invcNo);
			const res = await sendPurchase.mutateAsync({ purchase: payload });
			const err = kraResultError(res);
			if (!err) {
				captureEvent("etims_purchase_recorded", { has_vat: true });
				toast.success("Purchase confirmed with KRA eTIMS");
				onOpenChange(false);
				onSuccess?.();
				return;
			}
			const expected = parseExpectedInvcNo(err);
			if (expected && expected !== invcNo) {
				invcNo = expected;
				form.setValue("invcNo", expected);
				toast.message(`KRA expected purchase invcNo ${expected}. Retrying…`);
				continue;
			}
			toast.error(err);
			return;
		}
		toast.error("Could not allocate the next KRA purchase number");
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent size="wide" className="w-full min-w-0 overflow-x-hidden overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{mirrored ? "Confirm mirrored purchase" : "Confirm purchase"}</SheetTitle>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6 min-w-0">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-4 min-w-0">
							<FormField
								control={form.control}
								name="spplrTin"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Supplier PIN</FormLabel>
										<FormControl>
											<Input className="font-mono uppercase" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="spplrNm"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Supplier name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="spplrBhfId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Supplier branch</FormLabel>
										<FormControl>
											<Input maxLength={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="spplrInvcNo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Supplier invoice #</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
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
										<FormLabel>Our invcNo</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="pchsDt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Purchase date</FormLabel>
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
							<div className="flex items-center justify-between">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lines</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => append(emptyLine())}
								>
									<Plus className="mr-1 h-4 w-4" />
									Add line
								</Button>
							</div>
							{fields.map((field, index) => {
								const selected = itemOptions.find((it) => it.id === form.watch(`lines.${index}.itemCd`));
								const amts = lineAmountsFromInclusive({
									inclusiveUnitPrice: Number(form.watch(`lines.${index}.inclusivePrc`)) || 0,
									qty: Number(form.watch(`lines.${index}.qty`)) || 0,
									taxTyCd: form.watch(`lines.${index}.taxTyCd`) ?? "B",
									dcRt: Number(form.watch(`lines.${index}.dcRt`)) || 0,
								});
								return (
									<div key={field.id} className="rounded-xl border p-4 space-y-3">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<FormLabel>Map to a registered service (optional)</FormLabel>
												<ComboboxDropdown
													inDialog
													placeholder="Select our item code…"
													searchPlaceholder="Search…"
													items={itemOptions}
													selectedItem={selected}
													onSelect={(item) => applyItem(index, item)}
												/>
											</div>
											{fields.length > 1 ? (
												<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											) : null}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
											<FormField
												control={form.control}
												name={`lines.${index}.itemCd`}
												render={({ field: f }) => (
													<FormItem>
														<FormLabel>Item code</FormLabel>
														<FormControl>
															<Input className="font-mono" {...f} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.itemNm`}
												render={({ field: f }) => (
													<FormItem>
														<FormLabel>Item name</FormLabel>
														<FormControl>
															<Input {...f} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.itemClsCd`}
												render={({ field: f }) => (
													<FormItem>
														<FormLabel>Class code</FormLabel>
														<FormControl>
															<Input className="font-mono" {...f} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 min-w-0">
											<FormField
												control={form.control}
												name={`lines.${index}.qty`}
												render={({ field: f }) => (
													<FormItem className="min-w-0">
														<FormLabel>Qty</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...f} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.inclusivePrc`}
												render={({ field: f }) => (
													<FormItem className="min-w-0">
														<FormLabel>Unit price (incl. VAT)</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...f} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.dcRt`}
												render={({ field: f }) => (
													<FormItem className="min-w-0">
														<FormLabel>Discount %</FormLabel>
														<FormControl>
															<Input type="number" step="0.01" {...f} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`lines.${index}.taxTyCd`}
												render={({ field: f }) => (
													<FormItem className="min-w-0">
														<FormLabel>Tax</FormLabel>
														<Select value={f.value} onValueChange={f.onChange}>
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
											Taxable {amts.taxblAmt.toFixed(2)} · VAT {amts.taxAmt.toFixed(2)} · Line total {amts.totAmt.toFixed(2)}
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
								<span className="text-muted-foreground">VAT</span>
								<span>{totals.totTaxAmt.toFixed(2)} KES</span>
							</div>
							<div className="flex justify-between font-semibold">
								<span>Total (incl. VAT)</span>
								<span>{totals.totAmt.toFixed(2)} KES</span>
							</div>
						</div>

						<SheetFooter className="gap-2">
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sendPurchase.isPending}>
								Cancel
							</Button>
							<Button type="submit" disabled={sendPurchase.isPending}>
								{sendPurchase.isPending ? (
									<>
										<Spinner size={16} className="mr-2" />
										Sending…
									</>
								) : (
									"Confirm with KRA"
								)}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

function emptyLine(): FormData["lines"][number] {
	return {
		itemCd: "",
		itemNm: "",
		itemClsCd: "",
		pkgUnitCd: "NT",
		qtyUnitCd: "U",
		taxTyCd: "B",
		qty: 1,
		inclusivePrc: 0,
		dcRt: 0,
		spplrItemCd: "",
		spplrItemNm: "",
	};
}

function emptyForm(invcNo = 1): FormData {
	return {
		spplrTin: "",
		spplrNm: "",
		spplrBhfId: "00",
		spplrInvcNo: 1,
		invcNo,
		pmtTyCd: "01",
		pchsDt: isoDateInNairobi(),
		remark: "",
		lines: [emptyLine()],
	};
}

function formFromMirrored(mirrored: MirroredPurchase | null | undefined, invcNo: number): FormData {
	if (!mirrored) return emptyForm(invcNo);
	const itemList = Array.isArray(mirrored.itemList) ? (mirrored.itemList as Record<string, unknown>[]) : [];
	const salesDt = String(mirrored.salesDt ?? mirrored.pchsDt ?? "");
	const pchsDt = salesDt.length === 8
		? `${salesDt.slice(0, 4)}-${salesDt.slice(4, 6)}-${salesDt.slice(6, 8)}`
		: isoDateInNairobi();
	const lines = (itemList.length ? itemList : [{}]).map((line) => {
		const qty = Number(line.qty ?? 1) || 1;
		const tot = Number(line.totAmt ?? 0);
		const prc = Number(line.prc ?? 0) || (qty ? tot / qty : 0);
		return {
			itemCd: String(line.itemCd ?? ""),
			itemNm: String(line.itemNm ?? ""),
			itemClsCd: String(line.itemClsCd ?? ""),
			pkgUnitCd: String(line.pkgUnitCd ?? "NT"),
			qtyUnitCd: String(line.qtyUnitCd ?? "U"),
			taxTyCd: String(line.taxTyCd ?? "B"),
			qty,
			inclusivePrc: round2(prc),
			dcRt: Number(line.dcRt ?? 0),
			spplrItemCd: String(line.itemCd ?? ""),
			spplrItemNm: String(line.itemNm ?? ""),
		};
	});
	return {
		spplrTin: String(mirrored.spplrTin ?? mirrored.sPin ?? mirrored.tin ?? "").toUpperCase(),
		spplrNm: String(mirrored.spplrNm ?? mirrored.sNm ?? mirrored.taxprNm ?? ""),
		spplrBhfId: String(mirrored.spplrBhfId ?? mirrored.bhfId ?? "00"),
		spplrInvcNo: Number(mirrored.spplrInvcNo ?? mirrored.invcNo ?? 1) || 1,
		invcNo,
		pmtTyCd: String(mirrored.pmtTyCd ?? "01"),
		pchsDt,
		remark: String(mirrored.remark ?? ""),
		lines,
	};
}
