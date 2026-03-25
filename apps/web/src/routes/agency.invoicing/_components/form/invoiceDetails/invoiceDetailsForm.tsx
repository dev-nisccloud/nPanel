"use client";
import CustomTextInput from "@/routes/agency.invoicing/_components/ui/customTextInput";
import CurrencyInput from "@/routes/agency.invoicing/_components/ui/currencyInput";
import { currencyList } from "@/lib/currency";
import { Input } from "@/routes/agency.invoicing/_components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import CustomNumberInput from "@/routes/agency.invoicing/_components/ui/customNumberInput";
import { useGetValue } from "@/routes/agency.invoicing/hooks/useGetValue";
import { Controller, useFormContext } from "react-hook-form";
import type { Item } from "@/routes/agency.invoicing/types";

export const InvoiceDetailsForm = () => {
  const { control } = useFormContext();
	const currency = useGetValue("currency", "KES");
  const currencyDetails = currencyList.find(
		(option) => option.value.toLowerCase() === currency.toLowerCase(),
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
					next[index] = {
						...next[index],
						...updates,
					};
					onChange(next);
				};

				const removeItem = (index: number) => {
					const next = [...items];
					next.splice(index, 1);
					onChange(next.length > 0 ? next : [{ itemDescription: "" }]);
				};

				const appendItem = () => {
					onChange([...items, { itemDescription: "" }]);
				};

				return (
        <div className="pt-24">
          <p className="text-2xl font-semibold pb-3">Invoice Details</p>
          <div className="flex flex-col gap-6">
            <div>
								<p className="pt-3 font-medium text-neutral-500">Select an invoice currency</p>
              <CurrencyInput />
            </div>
            <div>
              <p className="py-3 font-medium text-sm text-neutral-500">Items</p>
								{items.map(({ itemDescription, amount, qty }, index) => (
									<div className="flex relative items-center group -ml-8" key={index}>
										<div className={`w-9 h-7 ${items.length === 1 ? "invisible" : ""}`}>
                      <button
												onClick={() => removeItem(index)}
                        type="button"
                        className="flex-shrink-0 rounded-md p-1.5 group-hover:bg-gray-50 hidden group-hover:block"
                      >
                        <Trash2 className="w-4 text-gray-500 h-4 group-hover:text-red-400" />
                      </button>
                    </div>
                    <div className="w-full flex-1">
                      <Input
                        placeholder="Item name"
												value={itemDescription ?? ""}
                        type="text"
												onChange={(event) => {
													updateItem(index, { itemDescription: event.target.value });
                        }}
                      />
                    </div>
                    <div className="w-14">
                      <Input
                        placeholder="Qty"
												value={qty ? `${qty}` : ""}
                        type="text"
                        pattern="[0-9]*"
												onChange={(event) => {
													const inputValue = event.target.value;
													if (/^-?\d*\.?\d*$/.test(inputValue) || inputValue === "") {
														updateItem(index, { qty: inputValue === "" ? undefined : Number(inputValue) });
                          }
                        }}
                      />
                    </div>
                    <div className="w-14">
                      <Input
                        placeholder="Amount"
												value={amount ? `${amount}` : ""}
                        type="text"
                        pattern="[0-9]*"
												onChange={(event) => {
													const inputValue = event.target.value;
													if (/^-?\d*\.?\d*$/.test(inputValue) || inputValue === "") {
														updateItem(index, { amount: inputValue === "" ? undefined : Number(inputValue) });
                          }
                        }}
                      />
                    </div>
                  </div>
								))}
              <div className="py-3 border-dashed border-b border-gray-300">
                <button
										onClick={appendItem}
                  type="button"
                  className="flex justify-center items-center text-orange-500 font-medium text-sm gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <p>Add Item</p>
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
								<CustomNumberInput label="Taxes" placeholder="0%" variableName="tax" />
            </div>
          </div>
        </div>
				);
			}}
    />
  );
};

