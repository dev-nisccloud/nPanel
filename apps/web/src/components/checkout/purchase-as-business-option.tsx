"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PurchaseAsBusinessOptionProps = {
	value: boolean;
	onChange: (purchaseAsBusiness: boolean) => void;
	disabled?: boolean;
};

export function PurchaseAsBusinessOption({
	value,
	onChange,
	disabled = false,
}: PurchaseAsBusinessOptionProps) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
			<div className="min-w-0 space-y-0.5">
				<Label htmlFor="checkout-purchase-as-business" className="text-sm font-medium">
					Purchase as a business
				</Label>
				<p className="text-xs text-muted-foreground leading-snug">
					Invoice uses your company billing settings instead of your profile.
				</p>
			</div>
			<Switch
				id="checkout-purchase-as-business"
				checked={value}
				onCheckedChange={onChange}
				disabled={disabled}
				className="shrink-0"
			/>
		</div>
	);
}
