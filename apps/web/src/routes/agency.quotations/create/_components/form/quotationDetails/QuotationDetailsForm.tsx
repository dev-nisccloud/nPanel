"use client";

import CustomTextInput from "@/routes/agency.invoices/create/_components/ui/customTextInput";
import CurrencyInput from "@/routes/agency.invoices/create/_components/ui/currencyInput";
import { currencyList } from "@/lib/currency";
import { Input } from "@/routes/agency.invoices/create/_components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import CustomNumberInput from "@/routes/agency.invoices/create/_components/ui/customNumberInput";
import { useGetValue } from "@/routes/agency.quotations/create/hooks/useGetValue";
import { Controller, useFormContext } from "react-hook-form";
import type { Item } from "@/routes/agency.quotations/create/types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export const QuotationDetailsForm = () => {
	const { control } = useFormContext();
	const currency = useGetValue("currency", "KES");
	const currencyDetails = currencyList.find(
		(c) => c.value.toLowerCase() === currency.toLowerCase(),
	)?.details;

	return (
		<Controller
			control={control}
			name="items"
			defaultValue={[{ itemDescription: "" }]}
			render={({ field: { onChange, value } }) => {
				const items: Item[] = value ?? [];
				const updateItem = (index: number, updates: Partial<Item>) => {
					const next = [...items];
					next[index] = { ...next[index], ...updates };
					onChange(next);
				};
				const removeItem = (index: number) => {
					const next = [...items];
					next.splice(index, 1);
					onChange(next.length > 0 ? next : [{ itemDescription: "" }]);
				};
				const appendItem = () => onChange([...items, { itemDescription: "" }]);

				return (
					<div className="pt-24">
						<p className="text-2xl font-semibold pb-3">Quotation Details</p>
						<div className="flex flex-col gap-6">
							<div>
								<p className="pt-3 font-medium text-neutral-500">Select currency</p>
								<CurrencyInput />
							</div>
							<div>
								<p className="py-3 font-medium text-sm text-neutral-500">Items</p>
								{items.map((item, index) => (
									<div
										className="flex relative items-start group -ml-8 gap-2 flex-wrap pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0"
										key={index}
									>
										<div className={`w-9 h-7 flex-shrink-0 ${items.length === 1 ? "invisible" : ""}`}>
											<button
												type="button"
												onClick={() => removeItem(index)}
												className="flex-shrink-0 rounded-md p-1.5 group-hover:bg-gray-50 hidden group-hover:block"
												aria-label="Remove item"
											>
												<Trash2 className="w-4 text-gray-500 h-4 group-hover:text-red-400" />
											</button>
										</div>
										<div className="flex-1 min-w-[200px] space-y-3">
											<Input
												placeholder="Item name"
												value={item.itemDescription ?? ""}
												type="text"
												onChange={(e) => updateItem(index, { itemDescription: e.target.value })}
											/>
											{/* Billing cycle (optional) */}
											<Select
												value={item.billingCycle || "__unset__"}
												onValueChange={(v) =>
													updateItem(index, {
														billingCycle: v === "__unset__" ? undefined : v,
													})
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Billing cycle (optional)" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="__unset__">None</SelectItem>
													<SelectItem value="one-time">One Time</SelectItem>
													<SelectItem value="monthly">Monthly</SelectItem>
													<SelectItem value="quarterly">Quarterly</SelectItem>
													<SelectItem value="annually">Annually</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="w-14 flex-shrink-0">
											<Input
												placeholder="Qty"
												value={item.qty != null ? String(item.qty) : ""}
												type="text"
												pattern="[0-9]*"
												onChange={(e) => {
													const v = e.target.value;
													if (/^-?\d*\.?\d*$/.test(v) || v === "")
														updateItem(index, { qty: v === "" ? undefined : Number(v) });
												}}
											/>
										</div>
										<div className="w-20 flex-shrink-0">
											<Input
												placeholder={currencyDetails?.currencySymbol ?? ""}
												value={item.amount != null ? String(item.amount) : ""}
												type="text"
												pattern="[0-9]*\.?[0-9]*"
												onChange={(e) => {
													const v = e.target.value;
													if (/^-?\d*\.?\d*$/.test(v) || v === "")
														updateItem(index, { amount: v === "" ? undefined : Number(v) });
												}}
											/>
										</div>
									</div>
								))}
								<div className="py-3 border-dashed border-b border-gray-300">
									<button
										type="button"
										onClick={appendItem}
										className="flex justify-center items-center text-orange-500 font-medium text-sm gap-2"
									>
										<Plus className="w-4 h-4" />
										Add Item
									</button>
								</div>
							</div>
							<div>
								<p className="pt-3 font-medium text-sm text-neutral-500 pb-5">Note</p>
								<CustomTextInput placeholder="Add a note" variableName="note" />
							</div>
							<div>
								<p className="pt-3 font-medium text-sm text-neutral-500 pb-5">More options</p>
								<CustomNumberInput
									label="Discount"
									placeholder={`${currencyDetails?.currencySymbol ?? ""}0`}
									variableName="discount"
								/>
								<CustomNumberInput label="Taxable percentage" placeholder="0%" variableName="taxPercentage" />
							</div>
						</div>
					</div>
				);
			}}
		/>
	);
};
