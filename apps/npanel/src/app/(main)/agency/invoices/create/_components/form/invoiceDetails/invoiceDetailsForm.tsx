"use client";

import * as React from "react";
import CustomTextInput from "@/app/(main)/agency/invoices/create/_components/ui/customTextInput";
import CurrencyInput from "@/app/(main)/agency/invoices/create/_components/ui/currencyInput";
import { currencyList } from "@/lib/currency";
import { Input } from "@/app/(main)/agency/invoices/create/_components/ui/input";
import { Plus, Trash2, Package, Building2 } from "lucide-react";
import CustomNumberInput from "@/app/(main)/agency/invoices/create/_components/ui/customNumberInput";
import { useGetValue } from "@/app/(main)/agency/invoices/create/hooks/useGetValue";
import { Controller, useFormContext } from "react-hook-form";
import type { Item } from "@/app/(main)/agency/invoices/create/types";
import { SelectAdAccountSheet } from "./select-ad-account-sheet";
import { trpc } from "@/utils/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";

export const InvoiceDetailsForm = () => {
  const { control } = useFormContext();
  const currency = useGetValue("currency", "KES");
  const currencyDetails = currencyList.find(
    (option) => option.value.toLowerCase() === currency.toLowerCase()
  )?.details;

  const [commissionSheetState, setCommissionSheetState] = React.useState<{
    index: number;
    commissionRatePercent: number;
    productName: string;
    planName: string;
  } | null>(null);

  const { data: products = [], isLoading: isLoadingProducts } = trpc.products.getAll.useQuery(
    { isActive: true },
    { refetchOnWindowFocus: false }
  );

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
                {items.map((item, index) => (
                  <InvoiceItemRow
                    key={index}
                    item={item}
                    index={index}
                    currencyDetails={currencyDetails}
                    products={products}
                    isLoadingProducts={isLoadingProducts}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    itemsLength={items.length}
                    onOpenCommissionSheet={(commissionRatePercent, productName, planName) =>
                      setCommissionSheetState({ index, commissionRatePercent, productName, planName })
                    }
                  />
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
                <CustomNumberInput label="Tax Percentage" placeholder="0%" variableName="taxPercentage" />
              </div>
            </div>

            <SelectAdAccountSheet
              open={commissionSheetState !== null}
              onOpenChange={(open) => !open && setCommissionSheetState(null)}
              commissionRatePercent={commissionSheetState?.commissionRatePercent ?? 0}
              onSelect={(context) => {
                if (commissionSheetState === null) return;
                const idx = commissionSheetState.index;
                const fromLabel = context.dateRangeSince
                  ? new Date(context.dateRangeSince + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";
                const toLabel = context.dateRangeUntil
                  ? new Date(context.dateRangeUntil + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";
                const dateRangeLabel = [fromLabel, toLabel].filter(Boolean).join(" – ");
                const desc = [commissionSheetState.productName, "Meta Ads", dateRangeLabel]
                  .filter(Boolean)
                  .join(" - ");
                const amount = (context.commissionRatePercent / 100) * context.adSpend;
                updateItem(idx, {
                  commissionContext: context,
                  itemDescription: desc || items[idx]?.itemDescription,
                  amount: Math.round(amount * 100) / 100,
                  qty: 1,
                });
                setCommissionSheetState(null);
              }}
            />
          </div>
        );
      }}
    />
  );
};

type Product = { id: string; name: string };
type Plan = {
  id: string;
  name: string;
  pricingModel: string;
  price: string | null;
  commissionRate?: number | null;
};

function InvoiceItemRow({
  item,
  index,
  currencyDetails,
  products,
  isLoadingProducts,
  updateItem,
  removeItem,
  itemsLength,
  onOpenCommissionSheet,
}: {
  item: Item;
  index: number;
  currencyDetails: { currencySymbol?: string } | undefined;
  products: Product[];
  isLoadingProducts: boolean;
  updateItem: (index: number, updates: Partial<Item>) => void;
  removeItem: (index: number) => void;
  itemsLength: number;
  onOpenCommissionSheet: (commissionRatePercent: number, productName: string, planName: string) => void;
}) {
  const selectedProductId = item.productId ?? "";
  const selectedPlanId = item.productPlanId ?? "";

  const { data: productWithPlans, isLoading: isLoadingPlans } = trpc.products.getById.useQuery(
    { id: selectedProductId, includePlans: true },
    { enabled: !!selectedProductId, refetchOnWindowFocus: false }
  );

  const plans = (productWithPlans as { plans?: Plan[] } | undefined)?.plans ?? [];
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const isCommissionPlan = selectedPlan?.pricingModel === "COMMISSION";
  const commissionRate = selectedPlan?.commissionRate != null ? Number(selectedPlan.commissionRate) : 0;

  const handleProductChange = (productId: string) => {
    if (!productId) {
      updateItem(index, {
        productId: undefined,
        productPlanId: undefined,
        commissionContext: undefined,
        itemDescription: "",
        amount: undefined,
        qty: undefined,
      });
      return;
    }
    const product = products.find((p) => p.id === productId);
    updateItem(index, {
      productId,
      productPlanId: undefined,
      commissionContext: undefined,
      itemDescription: product?.name ?? "",
      amount: undefined,
      qty: 1,
    });
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      updateItem(index, { productPlanId: undefined, commissionContext: undefined, amount: undefined });
      return;
    }
    updateItem(index, {
      productPlanId: planId,
      commissionContext: undefined,
      itemDescription: [productWithPlans?.name, plan.name].filter(Boolean).join(" - ") || item.itemDescription,
      amount: plan.pricingModel === "FIXED" && plan.price ? parseFloat(plan.price) : undefined,
      qty: 1,
    });
  };

  return (
    <div className="flex relative items-start group -ml-8 gap-2 flex-wrap" key={index}>
      <div className={cn("w-9 h-7 flex-shrink-0", itemsLength === 1 && "invisible")}>
        <button
          onClick={() => removeItem(index)}
          type="button"
          className="flex-shrink-0 rounded-md p-1.5 group-hover:bg-gray-50 hidden group-hover:block"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 text-gray-500 h-4 group-hover:text-red-400" />
        </button>
      </div>

      <div className="flex-1 min-w-[200px] space-y-2">
        {/* Product: Manual vs From catalog */}
        <Select
          value={selectedProductId || "__manual__"}
          onValueChange={(v) => handleProductChange(v === "__manual__" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__manual__">Enter manually</SelectItem>
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size={20} />
              </div>
            ) : (
              products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    {p.name}
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Plan (only when product has plans) */}
        {selectedProductId && plans.length > 0 && (
          <Select value={selectedPlanId || ""} onValueChange={handlePlanChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingPlans ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size={20} />
                </div>
              ) : (
                plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.pricingModel === "COMMISSION" && p.commissionRate != null && (
                      <span className="text-muted-foreground ml-1">({p.commissionRate}% commission)</span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}

        {/* Commission: Select ad account (only when plan is COMMISSION) */}
        {isCommissionPlan && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() =>
                onOpenCommissionSheet(
                  commissionRate,
                  (productWithPlans as { name?: string } | undefined)?.name ?? "",
                  selectedPlan?.name ?? ""
                )
              }
            >
              <Building2 className="h-3.5 w-3.5" />
              {item.commissionContext ? "Change ad account / campaign" : "Select ad account"}
            </Button>
            {item.commissionContext && (
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {item.commissionContext.metaAdsCampaignName} · {formatSpend(item.commissionContext.adSpend)}
              </span>
            )}
          </div>
        )}

        {/* Item name (manual or editable label for product) */}
        <Input
          placeholder="Item name"
          value={item.itemDescription ?? ""}
          type="text"
          onChange={(e) => updateItem(index, { itemDescription: e.target.value })}
        />
      </div>

      <div className="w-14 flex-shrink-0">
        <Input
          placeholder="Qty"
          value={item.qty != null ? String(item.qty) : ""}
          type="text"
          pattern="[0-9]*"
          onChange={(e) => {
            const v = e.target.value;
            if (/^-?\d*\.?\d*$/.test(v) || v === "") {
              updateItem(index, { qty: v === "" ? undefined : Number(v) });
            }
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
            if (/^-?\d*\.?\d*$/.test(v) || v === "") {
              updateItem(index, { amount: v === "" ? undefined : Number(v) });
            }
          }}
        />
      </div>
    </div>
  );
}

function formatSpend(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
