"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const READ_ONLY_INPUT_CLASS =
	"bg-muted/50 cursor-default text-foreground disabled:opacity-100";

export type MpesaPaymentFieldsProps = {
	currency: string;
	/** Only agency roles may edit amount and account reference. */
	canEditPaymentDetails: boolean;
	showPhone?: boolean;
	phoneNumber: string;
	onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	phoneError?: string;
	amount: string;
	onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	amountError?: string;
	amountHelperText?: string;
	accountReference: string;
	onAccountReferenceChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	accountRefError?: string;
	accountRefHelperText?: string;
	idPrefix?: string;
};

export function MpesaPaymentFields({
	currency,
	canEditPaymentDetails,
	showPhone = true,
	phoneNumber,
	onPhoneNumberChange,
	phoneError,
	amount,
	onAmountChange,
	amountError,
	amountHelperText,
	accountReference,
	onAccountReferenceChange,
	accountRefError,
	accountRefHelperText,
	idPrefix = "mpesa",
}: MpesaPaymentFieldsProps) {
	const paymentDetailsLocked = !canEditPaymentDetails;
	const columnCount = showPhone ? 3 : 2;

	return (
		<div
			className={cn(
				"grid max-w-full grid-cols-1 gap-2.5 sm:items-start sm:gap-3",
				columnCount === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
			)}
		>
			{showPhone ? (
				<div className="min-w-0 space-y-1">
					<label htmlFor={`${idPrefix}-phone`} className="text-xs font-medium text-foreground">
						Phone number <span className="text-destructive">*</span>
					</label>
					<Input
						id={`${idPrefix}-phone`}
						placeholder="0712345678"
						value={phoneNumber}
						onChange={onPhoneNumberChange}
						className={cn("h-9", phoneError && "border-destructive")}
					/>
					{phoneError ? (
						<p className="text-[11px] text-destructive">{phoneError}</p>
					) : (
						<p className="text-[11px] text-muted-foreground">M-Pesa registered number</p>
					)}
				</div>
			) : null}

			<div className="min-w-0 space-y-1">
				<label htmlFor={`${idPrefix}-amount`} className="text-xs font-medium text-foreground">
					Amount ({currency}) <span className="text-destructive">*</span>
				</label>
				<Input
					id={`${idPrefix}-amount`}
					type="number"
					placeholder="Amount"
					value={amount}
					onChange={onAmountChange}
					readOnly={paymentDetailsLocked}
					disabled={paymentDetailsLocked}
					className={cn("h-9", paymentDetailsLocked && READ_ONLY_INPUT_CLASS, amountError && "border-destructive")}
					min={1}
					step={1}
				/>
				{amountError ? (
					<p className="text-[11px] text-destructive">{amountError}</p>
				) : amountHelperText ? (
					<p className="text-[11px] text-muted-foreground">{amountHelperText}</p>
				) : null}
			</div>

			<div className="min-w-0 space-y-1">
				<label htmlFor={`${idPrefix}-reference`} className="text-xs font-medium text-foreground">
					Account reference <span className="text-destructive">*</span>
				</label>
				<Input
					id={`${idPrefix}-reference`}
					placeholder="Account reference"
					value={accountReference}
					onChange={paymentDetailsLocked ? undefined : onAccountReferenceChange}
					readOnly={paymentDetailsLocked}
					disabled={paymentDetailsLocked}
					className={cn(
						"h-9",
						paymentDetailsLocked && READ_ONLY_INPUT_CLASS,
						accountRefError && "border-destructive",
					)}
					maxLength={12}
				/>
				{accountRefError ? (
					<p className="text-[11px] text-destructive">{accountRefError}</p>
				) : accountRefHelperText ? (
					<p className="text-[11px] text-muted-foreground">{accountRefHelperText}</p>
				) : null}
			</div>
		</div>
	);
}
