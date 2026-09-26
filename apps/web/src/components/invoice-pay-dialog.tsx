"use client";

import * as React from "react";
import { CreditCard, DollarSign, Receipt } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { authClient } from "@/lib/auth-client";
import {
	PaymentMethodAccordion,
	PaymentMethodOption,
	PaymentMethodTrigger,
	PaymentMethodContent,
	MpesaPayButton,
} from "@/components/payment-method-accordion";
import { MpesaPaymentFields } from "@/components/mpesa-payment-fields";
// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
// import { JengaCardPaymentFields } from "@/components/jenga-card-payment-fields";
// import {
// 	submitJengaPaymentForm,
// 	validateJengaCustomerForm,
// 	type JengaCustomerFormState,
// } from "@/lib/jenga-checkout";
import { resolveMpesaCheckoutPayment } from "@/lib/mpesa-checkout-payment";
import {
	generateMpesaAccountReference,
	validateMpesaAccountReference,
} from "@/lib/mpesa-account-reference";
import { formatInvoiceMoney } from "@/lib/invoice-payment-totals";

type PaymentType = "COMPLETE" | "PARTIAL";

export type InvoicePayDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId: string;
	invoiceNumber: string | null;
	invoiceAmount: string | null;
	remainingAmount: number;
	currency: string;
	teamId?: string | null;
	customerUserId?: string | null;
	invoiceReturnPath: string;
	/** Agency only: show the existing complete/partial record-payment option. */
	showManual: boolean;
};

const TERMINAL_STK_CODES = new Set([0, 1, 2, 3, 4, 8, 17, 1019, 1025, 1032, 2001, 2028, 8006]);
const PROCESSING_STK_CODES = new Set([1037, 4999]);

function isTerminalStkCode(resultCode: string | number): boolean {
	const code = typeof resultCode === "string" ? Number.parseInt(resultCode, 10) : resultCode;
	if (Number.isNaN(code)) return false;
	if (PROCESSING_STK_CODES.has(code)) return false;
	if (TERMINAL_STK_CODES.has(code)) return true;
	return true;
}

function stkErrorMessage(code: number, resultDesc?: string | null): string {
	const map: Record<number, string> = {
		1: "Payment was not completed. Please try again.",
		1032: "Payment request was cancelled",
		2001: "Incorrect M-Pesa PIN entered. Please try again with the correct PIN",
	};
	return map[code] ?? resultDesc ?? `Payment failed with error code ${code}`;
}

export function InvoicePayDialog({
	open,
	onOpenChange,
	invoiceId,
	invoiceNumber,
	invoiceAmount,
	remainingAmount,
	currency,
	teamId,
	customerUserId,
	invoiceReturnPath,
	showManual,
}: InvoicePayDialogProps) {
	const { data: session } = authClient.useSession();
	const isAgencyUser = React.useMemo(() => {
		const role = String((session?.user as { role?: string } | undefined)?.role || "");
		return role.toUpperCase().includes("AGENCY");
	}, [session?.user]);

	const defaultAccountRef = React.useMemo(
		() => generateMpesaAccountReference(invoiceNumber || "INV", "INV"),
		[invoiceNumber],
	);

	const [method, setMethod] = React.useState<string | null>(null);
	const [phoneNumber, setPhoneNumber] = React.useState("");
	const [phoneError, setPhoneError] = React.useState("");
	const [paymentAmount, setPaymentAmount] = React.useState("");
	const [accountReference, setAccountReference] = React.useState(defaultAccountRef);
	const [accountRefError, setAccountRefError] = React.useState("");
	const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
	const [shouldStopPolling, setShouldStopPolling] = React.useState(false);
	// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
	// Define as undefined to prevent errors if accidentally referenced
	const jengaCustomer: any = undefined;
	const jengaCustomerErrors: any = undefined;
	const jengaRedirecting: any = undefined;
	// const [jengaCustomer, setJengaCustomer] = React.useState<JengaCustomerFormState>({
	// 	customerFirstName: "",
	// 	customerLastName: "",
	// 	customerEmail: "",
	// 	customerPhone: "",
	// 	customerAddress: "",
	// 	customerPostalCodeZip: "",
	// 	countryCode: "KE",
	// });
	// const [jengaCustomerErrors, setJengaCustomerErrors] = React.useState<
	// 	Partial<Record<keyof JengaCustomerFormState, string>>
	// >({});
	// const [jengaRedirecting, setJengaRedirecting] = React.useState(false);
	const [manualType, setManualType] = React.useState<PaymentType>("COMPLETE");
	const [manualAmountPaid, setManualAmountPaid] = React.useState("");

	const remainingCeil = Math.max(1, Math.ceil(remainingAmount));
	const utils = trpc.useUtils();
	const appliedCheckoutRef = React.useRef<string | null>(null);

	const userInfoQuery = trpc.userProfile.getUserInfo.useQuery(undefined, {
		enabled: open,
		staleTime: 60_000,
	});

	React.useEffect(() => {
		if (!open) return;
		setAccountReference(defaultAccountRef);
		setPaymentAmount(String(remainingCeil));
		setMethod(null);
		setCheckoutRequestId(null);
		setShouldStopPolling(false);
		setPhoneNumber("");
		setPhoneError("");
		setManualType("COMPLETE");
		setManualAmountPaid("");
		appliedCheckoutRef.current = null;
	}, [open, defaultAccountRef, remainingCeil]);

	React.useEffect(() => {
		if (!userInfoQuery.data) return;
		const profile = userInfoQuery.data.profile;
		// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
		// setJengaCustomer((prev) => ({
		// 	customerFirstName: prev.customerFirstName || profile?.firstName || "",
		// 	customerLastName: prev.customerLastName || profile?.lastName || "",
		// 	customerEmail: prev.customerEmail || userInfoQuery.data.email || "",
		// 	customerPhone: prev.customerPhone || profile?.phone || phoneNumber || "",
		// 	customerAddress: prev.customerAddress || profile?.address || "",
		// 	customerPostalCodeZip: prev.customerPostalCodeZip || profile?.postalCode || "",
		// 	countryCode:
		// 		prev.countryCode ||
		// 		(profile?.country?.length === 2 ? profile.country.toUpperCase() : "KE"),
		// }));
	}, [userInfoQuery.data, phoneNumber]);

	const invalidateInvoice = React.useCallback(() => {
		utils.invoicing.getById.invalidate({ id: invoiceId });
		utils.invoicing.list.invalidate();
	}, [invoiceId, utils.invoicing.getById, utils.invoicing.list]);

	const applyCheckoutPayment = trpc.invoicing.applyCheckoutPayment.useMutation({
		onSuccess: () => {
			captureEvent("invoice_payment_recorded", {
				payment_method: "gateway",
				amount: remainingAmount,
				currency: currency || "KES",
			});
			toast.success("Payment received");
			invalidateInvoice();
			onOpenChange(false);
		},
		onError: (e) => {
			toast.error(e.message ?? "Failed to apply payment to invoice");
		},
	});

	const updatePaymentMutation = trpc.invoicing.updatePayment.useMutation({
		onSuccess: (_data, variables) => {
			const amount =
				variables.type === "PARTIAL"
					? Number(variables.amountPaid)
					: Number(invoiceAmount ?? remainingAmount);
			captureEvent("invoice_payment_recorded", {
				payment_method: variables.type,
				amount: Number.isFinite(amount) ? amount : 0,
				currency: currency || "KES",
			});
			toast.success("Payment updated");
			invalidateInvoice();
			onOpenChange(false);
		},
		onError: (e) => {
			toast.error(e.message ?? "Failed to update payment");
		},
	});

	const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
		onSuccess: (response) => {
			const checkoutId = response.data?.checkoutRequestId;
			if (!checkoutId) {
				toast.error("Payment request sent but failed to get transaction ID.");
				return;
			}
			setShouldStopPolling(false);
			setCheckoutRequestId(checkoutId);
			toast.success("Check your phone for the M-Pesa prompt");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to initiate payment.");
			setCheckoutRequestId(null);
		},
	});

	// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
	// Define as undefined to prevent errors if accidentally referenced
	const initiateJengaPayment: any = { isPending: false, mutateAsync: async () => ({}) };
	// const initiateJengaPayment = trpc.paymentGateway.jenga.initiateCardPayment.useMutation({
	// 	onError: (error) => {
	// 		setJengaRedirecting(false);
	// 		toast.error(error.message || "Failed to start card payment.");
	// 	},
	// });

	const queryPaymentStatus = trpc.paymentGateway.mpesa.queryStkPush.useQuery(
		{ checkoutRequestId: checkoutRequestId || "" },
		{
			enabled: Boolean(checkoutRequestId) && open && !shouldStopPolling,
			staleTime: 0,
			gcTime: 0,
			refetchOnMount: "always",
			refetchOnWindowFocus: false,
			refetchInterval: (query) => {
				const response = query.state.data;
				const resultCode = response?.data?.resultCode;
				if (resultCode !== undefined && resultCode !== null) {
					const numeric =
						typeof resultCode === "string" ? Number.parseInt(resultCode, 10) : resultCode;
					if (!Number.isNaN(numeric) && isTerminalStkCode(numeric)) {
						return false;
					}
				}
				return 1000;
			},
		},
	);

	React.useEffect(() => {
		const resultCode = queryPaymentStatus.data?.data?.resultCode;
		if (resultCode === undefined || resultCode === null || !checkoutRequestId) return;
		const numeric = typeof resultCode === "string" ? Number.parseInt(resultCode, 10) : resultCode;
		if (Number.isNaN(numeric) || !isTerminalStkCode(numeric)) return;
		setShouldStopPolling(true);
		if (numeric === 0) {
			if (appliedCheckoutRef.current === checkoutRequestId) return;
			appliedCheckoutRef.current = checkoutRequestId;
			applyCheckoutPayment.mutate({ checkoutRequestId });
			return;
		}
		toast.error(stkErrorMessage(numeric, queryPaymentStatus.data?.data?.resultDesc));
		setCheckoutRequestId(null);
	}, [queryPaymentStatus.data, checkoutRequestId, applyCheckoutPayment]);

	const handleMpesaPay = () => {
		const digits = phoneNumber.replace(/\D/g, "");
		if (digits.length < 10) {
			setPhoneError("Enter a valid M-Pesa phone number");
			return;
		}
		setPhoneError("");
		const resolved = resolveMpesaCheckoutPayment({
			isAgencyUser,
			formAmount: paymentAmount,
			formAccountReference: accountReference,
			checkoutTotalIncVat: remainingCeil,
			intendedAccountReference: defaultAccountRef,
		});
		const accountErr = validateMpesaAccountReference(resolved.accountReference);
		if (accountErr) {
			setAccountRefError(accountErr);
			return;
		}
		setAccountRefError("");
		initiateMpesaPayment.mutate({
			phoneNumber,
			amount: resolved.amount,
			accountReference: resolved.accountReference,
			transactionDesc: "Invoice",
			checkoutTotalIncVat: remainingCeil,
			teamId: teamId ?? undefined,
			billedForUserId: isAgencyUser ? customerUserId ?? undefined : undefined,
			invoiceId,
		});
	};

	// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
	// const handleJengaPay = async () => {
	// 	const errors = validateJengaCustomerForm(jengaCustomer);
	// 	if (Object.keys(errors).length > 0) {
	// 		setJengaCustomerErrors(errors);
	// 		return;
	// 	}
	// 	setJengaCustomerErrors({});
	// 	const jengaCurrency =
	// 		currency === "TZS" || currency === "UGX" || currency === "USD" || currency === "EUR" || currency === "GBP"
	// 			? currency
	// 			: "KES";
	// 	setJengaRedirecting(true);
	// 	try {
	// 		const result = await initiateJengaPayment.mutateAsync({
	// 			...jengaCustomer,
	// 			amount: remainingCeil,
	// 			currency: jengaCurrency,
	// 			productType: "Service",
	// 			productDescription: `Invoice ${invoiceNumber || ""}`.trim().slice(0, 200) || "Invoice",
	// 			teamId: teamId ?? undefined,
	// 			orderIntent: {
	// 				source: "invoice",
	// 				returnOrigin: window.location.origin,
	// 				returnPath: "/payment/card/return",
	// 				currency: jengaCurrency,
	// 				teamId: teamId ?? undefined,
	// 				billedForUserId: isAgencyUser ? customerUserId ?? undefined : undefined,
	// 				skipInvoice: true,
	// 				invoiceId,
	// 				invoiceReturnPath,
	// 			},
	// 		});
	// 		if (!result.data?.checkoutUrl || !result.data.paymentData) {
	// 			throw new Error("Card checkout did not return a payment page.");
	// 		}
	// 		submitJengaPaymentForm(result.data.checkoutUrl, result.data.paymentData);
	// 	} catch (err) {
	// 		setJengaRedirecting(false);
	// 		toast.error(err instanceof Error ? err.message : "Failed to start card payment.");
	// 	}
	// };

	const handleManualSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (manualType === "COMPLETE") {
			updatePaymentMutation.mutate({ invoiceId, type: "COMPLETE" });
		} else {
			const value = manualAmountPaid.trim();
			if (!value) {
				toast.error("Amount paid is required for partial payment");
				return;
			}
			updatePaymentMutation.mutate({ invoiceId, type: "PARTIAL", amountPaid: value });
		}
	};

	const waitingForStk = Boolean(checkoutRequestId) && !shouldStopPolling;
	const applying = applyCheckoutPayment.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Pay invoice {invoiceNumber ? invoiceNumber : ""}
					</DialogTitle>
					<DialogDescription>
						Amount due: {formatInvoiceMoney(remainingAmount, currency || "KES")}
					</DialogDescription>
				</DialogHeader>

				<PaymentMethodAccordion value={method} onValueChange={setMethod}>
					<PaymentMethodOption
						value="mpesa"
						variant="mpesa"
						trigger={
							<PaymentMethodTrigger
								variant="mpesa"
								icon={<img src="/mpesa.png" alt="M-Pesa" className="h-full w-full object-contain" />}
								title="M-Pesa"
								description="Pay instantly from your phone - secured by Nisc Cloud"
							/>
						}
					>
						<PaymentMethodContent>
							{waitingForStk || applying ? (
								<div className="flex flex-col items-center py-8">
									<Spinner size={32} className="mb-4" />
									<p className="text-sm font-medium">
										{applying ? "Recording payment…" : "Waiting for payment confirmation…"}
									</p>
								</div>
							) : (
								<div className="space-y-4">
									<MpesaPaymentFields
										currency={currency || "KES"}
										canEditPaymentDetails={isAgencyUser}
										phoneNumber={phoneNumber}
										onPhoneNumberChange={(e) => {
											setPhoneNumber(e.target.value);
											setPhoneError("");
										}}
										phoneError={phoneError || undefined}
										amount={isAgencyUser ? paymentAmount : String(remainingCeil)}
										onAmountChange={(e) => setPaymentAmount(e.target.value)}
										amountHelperText={
											isAgencyUser
												? `Invoice total due: ${formatInvoiceMoney(remainingAmount, currency || "KES")} (editable)`
												: `Invoice total due: ${formatInvoiceMoney(remainingAmount, currency || "KES")}`
										}
										accountReference={accountReference}
										onAccountReferenceChange={(e) => {
											setAccountReference(e.target.value);
											setAccountRefError("");
										}}
										accountRefError={accountRefError || undefined}
										idPrefix="invoice-mpesa"
									/>
									<div className="flex justify-end">
										<MpesaPayButton
											onClick={handleMpesaPay}
											disabled={initiateMpesaPayment.isPending || !phoneNumber}
										>
											{initiateMpesaPayment.isPending ? "Processing…" : "Pay with M-Pesa"}
										</MpesaPayButton>
									</div>
								</div>
							)}
						</PaymentMethodContent>
					</PaymentMethodOption>

					{/* JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET) */}
					{/* <PaymentMethodOption
						value="card"
						trigger={
							<PaymentMethodTrigger
								icon={<CreditCard className="size-7 text-foreground" />}
								title="Card"
								description="Pay securely with Visa, Mastercard and more"
							/>
						}
					>
						<PaymentMethodContent>
							{jengaRedirecting || initiateJengaPayment.isPending ? (
								<div className="flex flex-col items-center py-8">
									<Spinner size={32} className="mb-4" />
									<p className="text-sm font-medium">Redirecting to secure card payment…</p>
								</div>
							) : (
								<div className="space-y-4">
									<JengaCardPaymentFields
										value={jengaCustomer}
										onChange={setJengaCustomer}
										errors={jengaCustomerErrors}
										idPrefix="invoice-jenga"
									/>
									<div className="flex justify-end">
										<Button onClick={() => void handleJengaPay()} disabled={initiateJengaPayment.isPending}>
											Pay with Card
										</Button>
									</div>
								</div>
							)}
						</PaymentMethodContent>
					</PaymentMethodOption> */}

					{showManual ? (
						<PaymentMethodOption
							value="manual"
							trigger={
								<PaymentMethodTrigger
									icon={<Receipt className="size-7 text-foreground" />}
									title="Record payment"
									description="Mark this invoice paid without collecting M-Pesa or card"
								/>
							}
						>
							<PaymentMethodContent>
								<form onSubmit={handleManualSubmit} className="space-y-4">
									<div className="space-y-2">
										<Label>Payment type</Label>
										<Select
											value={manualType}
											onValueChange={(v) => setManualType(v as PaymentType)}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="COMPLETE">Complete payment</SelectItem>
												<SelectItem value="PARTIAL">Partial payment</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{manualType === "PARTIAL" ? (
										<div className="space-y-2">
											<Label htmlFor="invoice-manual-amount">Amount paid ({currency})</Label>
											<Input
												id="invoice-manual-amount"
												inputMode="decimal"
												placeholder="0.00"
												value={manualAmountPaid}
												onChange={(e) => setManualAmountPaid(e.target.value)}
											/>
										</div>
									) : null}
									<div className="flex justify-end">
										<Button
											type="submit"
											disabled={
												updatePaymentMutation.isPending ||
												(manualType === "PARTIAL" && !manualAmountPaid.trim())
											}
										>
											{updatePaymentMutation.isPending ? "Updating…" : "Record payment"}
										</Button>
									</div>
								</form>
							</PaymentMethodContent>
						</PaymentMethodOption>
					) : null}
				</PaymentMethodAccordion>
			</DialogContent>
		</Dialog>
	);
}
