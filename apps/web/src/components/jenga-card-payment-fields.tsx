"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JengaCustomerFormState } from "@/lib/jenga-checkout";

export type JengaCardPaymentFieldsProps = {
	value: JengaCustomerFormState;
	onChange: (next: JengaCustomerFormState) => void;
	errors?: Partial<Record<keyof JengaCustomerFormState, string>>;
	idPrefix?: string;
	disabled?: boolean;
};

export function JengaCardPaymentFields({
	value,
	onChange,
	errors,
	idPrefix = "jenga",
	disabled,
}: JengaCardPaymentFieldsProps) {
	const set =
		(key: keyof JengaCustomerFormState) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const nextValue =
				key === "countryCode" ? e.target.value.toUpperCase() : e.target.value;
			onChange({ ...value, [key]: nextValue });
		};

	return (
		<div className="space-y-3">
			<p className="text-xs text-muted-foreground">
				You will enter card details on a secure payment page. Confirm billing details below.
			</p>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor={`${idPrefix}-first`}>First name</Label>
					<Input
						id={`${idPrefix}-first`}
						value={value.customerFirstName}
						onChange={set("customerFirstName")}
						disabled={disabled}
						className={errors?.customerFirstName ? "border-destructive" : undefined}
					/>
					{errors?.customerFirstName ? (
						<p className="text-xs text-destructive">{errors.customerFirstName}</p>
					) : null}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={`${idPrefix}-last`}>Last name</Label>
					<Input
						id={`${idPrefix}-last`}
						value={value.customerLastName}
						onChange={set("customerLastName")}
						disabled={disabled}
						className={errors?.customerLastName ? "border-destructive" : undefined}
					/>
					{errors?.customerLastName ? (
						<p className="text-xs text-destructive">{errors.customerLastName}</p>
					) : null}
				</div>
			</div>
			<div className="space-y-1.5">
				<Label htmlFor={`${idPrefix}-email`}>Email</Label>
				<Input
					id={`${idPrefix}-email`}
					type="email"
					value={value.customerEmail}
					onChange={set("customerEmail")}
					disabled={disabled}
					className={errors?.customerEmail ? "border-destructive" : undefined}
				/>
				{errors?.customerEmail ? (
					<p className="text-xs text-destructive">{errors.customerEmail}</p>
				) : null}
			</div>
			<div className="space-y-1.5">
				<Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
				<Input
					id={`${idPrefix}-phone`}
					value={value.customerPhone}
					onChange={set("customerPhone")}
					placeholder="2547XXXXXXXX"
					disabled={disabled}
					className={errors?.customerPhone ? "border-destructive" : undefined}
				/>
				{errors?.customerPhone ? (
					<p className="text-xs text-destructive">{errors.customerPhone}</p>
				) : null}
			</div>
			<div className="space-y-1.5">
				<Label htmlFor={`${idPrefix}-address`}>Address</Label>
				<Input
					id={`${idPrefix}-address`}
					value={value.customerAddress}
					onChange={set("customerAddress")}
					disabled={disabled}
					className={errors?.customerAddress ? "border-destructive" : undefined}
				/>
				{errors?.customerAddress ? (
					<p className="text-xs text-destructive">{errors.customerAddress}</p>
				) : null}
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor={`${idPrefix}-postal`}>Postal code</Label>
					<Input
						id={`${idPrefix}-postal`}
						value={value.customerPostalCodeZip}
						onChange={set("customerPostalCodeZip")}
						disabled={disabled}
						className={errors?.customerPostalCodeZip ? "border-destructive" : undefined}
					/>
					{errors?.customerPostalCodeZip ? (
						<p className="text-xs text-destructive">{errors.customerPostalCodeZip}</p>
					) : null}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={`${idPrefix}-country`}>Country code</Label>
					<Input
						id={`${idPrefix}-country`}
						value={value.countryCode}
						onChange={set("countryCode")}
						maxLength={2}
						placeholder="KE"
						disabled={disabled}
						className={errors?.countryCode ? "border-destructive" : undefined}
					/>
					{errors?.countryCode ? (
						<p className="text-xs text-destructive">{errors.countryCode}</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
