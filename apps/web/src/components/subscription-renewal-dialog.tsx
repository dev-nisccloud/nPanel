"use client";

import * as React from "react";
import { Receipt, RefreshCw } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	calculateRenewalPrice,
	calculateNextExpiryFromToday,
	formatBillingCycleLabel,
	formatRenewalPrice,
	getAvailableRenewalCycles,
	isDomainService,
	type RenewalBillingCycle,
} from "@/lib/subscription-renewal-pricing";
import {
	MpesaPayButton,
	PaymentMethodAccordion,
	PaymentMethodContent,
	PaymentMethodOption,
	PaymentMethodTrigger,
} from "@/components/payment-method-accordion";
import { MpesaPaymentFields } from "@/components/mpesa-payment-fields";
// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
// import { JengaCardPaymentFields } from "@/components/jenga-card-payment-fields";
// import {
// 	submitJengaPaymentForm,
// 	validateJengaCustomerForm,
// 	type JengaCustomerFormState,
// } from "@/lib/jenga-checkout";
import {
	generateMpesaAccountReference,
	validateMpesaAccountReference,
} from "@/lib/mpesa-account-reference";
import {
	canonicalMpesaPaymentAmount,
	resolveMpesaCheckoutPayment,
} from "@/lib/mpesa-checkout-payment";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { authClient } from "@/lib/auth-client";

export interface SubscriptionRenewalDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscription: {
		id: string;
		name: string | null;
		productId: string;
		productName: string;
		productPlanId: string | null;
		serviceType: string | null;
		agreedPrice: string | null;
		agreedCurrency: string | null;
		billingCycle: string | null;
		expiryDate: Date | null;
		userId: string | null;
		teamId: string | null;
	} | null;
}

type Step = "billing_cycle" | "payment" | "processing" | "success" | "error";

export function SubscriptionRenewalDialog({
	open,
	onOpenChange,
	subscription,
}: SubscriptionRenewalDialogProps) {
	const [step, setStep] = React.useState<Step>("billing_cycle");
	const [selectedCycle, setSelectedCycle] = React.useState<RenewalBillingCycle | null>(null);
	const [paymentMethod, setPaymentMethod] = React.useState<string>("mpesa");

	// M-Pesa state
	const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState("");
	const [mpesaAccountReference, setMpesaAccountReference] = React.useState("");
	const [manualTransactionRef, setManualTransactionRef] = React.useState("");

	// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
	// const [jengaCustomerForm, setJengaCustomerForm] = React.useState<JengaCustomerFormState>({
	// 	firstName: "",
	// 	lastName: "",
	// 	email: "",
	// 	phoneNumber: "",
	// });

	const createCheckout = trpc.paymentGateway.mpesa.createCheckoutRequest.useMutation();
	const createFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation();
	// const jengaMutation = trpc.paymentGateway.jenga.createPayment.useMutation();

	const { data: session } = authClient.useSession();
	const isAgencyUser = React.useMemo(() => {
		const role = (session?.user as { role?: string } | undefined)?.role;
		return role?.includes("AGENCY") ?? false;
	}, [session]);

	const isDomain = React.useMemo(() => {
		if (!subscription) return false;
		return isDomainService(subscription.serviceType, subscription.productName);
	}, [subscription]);

	const availableCycles = React.useMemo(() => {
		if (!subscription) return [];
		return getAvailableRenewalCycles(subscription.serviceType, isDomain);
	}, [subscription, isDomain]);

	const renewalPrice = React.useMemo(() => {
		if (!subscription || !selectedCycle) return "0";
		return calculateRenewalPrice(
			subscription.agreedPrice,
			subscription.billingCycle,
			selectedCycle
		);
	}, [subscription, selectedCycle]);

	const nextExpiry = React.useMemo(() => {
		if (!selectedCycle) return null;
		return calculateNextExpiryFromToday(selectedCycle);
	}, [selectedCycle]);

	// Initialize selected cycle
	React.useEffect(() => {
		if (open && subscription && !selectedCycle && availableCycles.length > 0) {
			// Default to current cycle if available, otherwise first available
			const currentCycleAvailable = availableCycles.find(
				(c) => c === subscription.billingCycle?.toUpperCase()
			);
			setSelectedCycle(currentCycleAvailable || availableCycles[0]!);
		}
	}, [open, subscription, selectedCycle, availableCycles]);

	// Generate M-Pesa account reference
	React.useEffect(() => {
		if (open && subscription && !mpesaAccountReference) {
			const label = subscription.name || subscription.productName || "RENEWAL";
			setMpesaAccountReference(generateMpesaAccountReference(label));
		}
	}, [open, subscription, mpesaAccountReference]);

	const handleReset = () => {
		setStep("billing_cycle");
		setSelectedCycle(null);
		setPaymentMethod("mpesa");
		setMpesaPhoneNumber("");
		setMpesaAccountReference("");
		// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
		// setJengaCustomerForm({
		// 	firstName: "",
		// 	lastName: "",
		// 	email: "",
		// 	phoneNumber: "",
		// });
	};

	const handleClose = () => {
		handleReset();
		onOpenChange(false);
	};

	const handleCycleChange = (cycle: string) => {
		setSelectedCycle(cycle as RenewalBillingCycle);
	};

	const handleContinueToPayment = () => {
		if (!selectedCycle) {
			toast.error("Please select a billing cycle");
			return;
		}
		captureEvent("renewal_billing_cycle_selected", {
			subscription_id: subscription?.id,
			cycle: selectedCycle,
			price: renewalPrice,
		});
		setStep("payment");
	};

	const handleMpesaPayment = async () => {
		if (!subscription || !selectedCycle) return;

		if (!validateMpesaAccountReference(mpesaAccountReference)) {
			toast.error("Invalid account reference format");
			return;
		}

		const phoneFormatted = mpesaPhoneNumber.trim().replace(/\D/g, "");
		if (!phoneFormatted || phoneFormatted.length < 9) {
			toast.error("Please enter a valid phone number");
			return;
		}

		const paymentAmount = Number.parseFloat(renewalPrice);
		if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
			toast.error("Invalid renewal price");
			return;
		}

		const canonicalAmount = canonicalMpesaPaymentAmount(paymentAmount);

		try {
			setStep("processing");
			captureEvent("renewal_payment_initiated", {
				subscription_id: subscription.id,
				method: "mpesa",
				amount: canonicalAmount,
			});

			const checkoutResult = await createCheckout.mutateAsync({
				amount: canonicalAmount.toString(),
				phoneNumber: phoneFormatted,
				accountReference: mpesaAccountReference,
			});

			const payment = resolveMpesaCheckoutPayment({
				checkoutRequestId: checkoutResult.checkoutRequestId,
				mpesaReceiptNumber: null,
			});

			// Create renewal order
			await createFromPayment.mutateAsync({
				checkoutRequestId: checkoutResult.checkoutRequestId,
				items: [
					{
						productId: subscription.productId,
						productPlanId: subscription.productPlanId || undefined,
						billingCycle: selectedCycle,
						itemPrice: renewalPrice,
						itemSubtotal: renewalPrice,
						description: "renewal",
						metadata: {
							existingSubscriptionId: subscription.id,
							renewalBillingCycle: selectedCycle,
							source: "manual-renewal-checkout",
						},
					},
				],
				currency: subscription.agreedCurrency || "KES",
				teamId: subscription.teamId || undefined,
				// For agency users: record order under subscription owner, not agency user
				billedForUserId: isAgencyUser && subscription.userId ? subscription.userId : undefined,
			});

			setStep("success");
			captureEvent("renewal_payment_completed", {
				subscription_id: subscription.id,
				cycle: selectedCycle,
			});

			toast.success("Renewal successful! Your subscription has been extended.");
		} catch (error) {
			console.error("Renewal payment error:", error);
			setStep("error");
			toast.error(error instanceof Error ? error.message : "Renewal payment failed");
		}
	};

	const handleManualRenewal = async () => {
		if (!subscription || !selectedCycle || !manualTransactionRef.trim()) return;

		const paymentAmount = Number.parseFloat(renewalPrice);
		if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
			toast.error("Invalid renewal price");
			return;
		}

		try {
			setStep("processing");
			captureEvent("renewal_manual_payment_recorded", {
				subscription_id: subscription.id,
				method: "manual",
				amount: paymentAmount,
			});

			// Create renewal order with manual transaction reference
			await createFromPayment.mutateAsync({
				checkoutRequestId: manualTransactionRef.trim(),
				items: [
					{
						productId: subscription.productId,
						productPlanId: subscription.productPlanId || undefined,
						billingCycle: selectedCycle,
						itemPrice: renewalPrice,
						itemSubtotal: renewalPrice,
						description: "renewal",
						metadata: {
							existingSubscriptionId: subscription.id,
							renewalBillingCycle: selectedCycle,
							source: "manual-renewal-checkout",
							manualPayment: true,
						},
					},
				],
				currency: subscription.agreedCurrency || "KES",
				teamId: subscription.teamId || undefined,
				billedForUserId: isAgencyUser && subscription.userId ? subscription.userId : undefined,
			});

			setStep("success");
			captureEvent("renewal_manual_payment_completed", {
				subscription_id: subscription.id,
				cycle: selectedCycle,
			});

			toast.success("Renewal recorded successfully! Subscription has been extended.");
		} catch (error) {
			console.error("Manual renewal error:", error);
			setStep("error");
			toast.error(error instanceof Error ? error.message : "Failed to record renewal");
		}
	};

	// JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET)
	// const handleJengaPayment = async () => {
	// 	if (!subscription || !selectedCycle) return;

	// 	const validation = validateJengaCustomerForm(jengaCustomerForm);
	// 	if (!validation.valid) {
	// 		toast.error(validation.errors[0] || "Please fill in all required fields");
	// 		return;
	// 	}

	// 	const paymentAmount = Number.parseFloat(renewalPrice);
	// 	if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
	// 		toast.error("Invalid renewal price");
	// 		return;
	// 	}

	// 	try {
	// 		setStep("processing");
	// 		captureEvent("renewal_payment_initiated", {
	// 			subscription_id: subscription.id,
	// 			method: "jenga_card",
	// 			amount: paymentAmount,
	// 		});

	// 		const jengaResult = await jengaMutation.mutateAsync({
	// 			...jengaCustomerForm,
	// 			amount: paymentAmount.toString(),
	// 			currency: subscription.agreedCurrency || "KES",
	// 		});

	// 		if (!jengaResult.paymentFormUrl) {
	// 			throw new Error("Failed to generate payment form");
	// 		}

	// 		// Create renewal order first
	// 		await createFromPayment.mutateAsync({
	// 			checkoutRequestId: jengaResult.orderId,
	// 			items: [
	// 				{
	// 					productId: subscription.productId,
	// 					productPlanId: subscription.productPlanId || undefined,
	// 					billingCycle: selectedCycle,
	// 					itemPrice: renewalPrice,
	// 					itemSubtotal: renewalPrice,
	// 					description: "renewal",
	// 					metadata: {
	// 						existingSubscriptionId: subscription.id,
	// 						renewalBillingCycle: selectedCycle,
	// 						source: "manual-renewal-checkout",
	// 					},
	// 				},
	// 			],
	// 			currency: subscription.agreedCurrency || "KES",
	// 			teamId: subscription.teamId || undefined,
	// 			// For agency users: record order under subscription owner, not agency user
	// 			billedForUserId: isAgencyUser && subscription.userId ? subscription.userId : undefined,
	// 		});

	// 		// Submit to Jenga
	// 		await submitJengaPaymentForm(jengaResult.paymentFormUrl);

	// 		setStep("success");
	// 		captureEvent("renewal_payment_completed", {
	// 			subscription_id: subscription.id,
	// 			cycle: selectedCycle,
	// 		});

	// 		toast.success("Renewal successful! Your subscription has been extended.");
	// 	} catch (error) {
	// 		console.error("Renewal payment error:", error);
	// 		setStep("error");
	// 		toast.error(error instanceof Error ? error.message : "Renewal payment failed");
	// 	}
	// };

	if (!subscription) return null;

	const currency = subscription.agreedCurrency || "KES";

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<RefreshCw className="h-5 w-5" />
						Renew Subscription
					</DialogTitle>
					<DialogDescription>
						Extend your subscription: {subscription.name || subscription.productName}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="flex-1 pr-4">
					{step === "billing_cycle" && (
						<div className="space-y-6 py-4">
							<div className="rounded-lg border bg-muted/50 p-4 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">
										Current Status
									</span>
									<Badge variant="destructive">Expired/Suspended</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">
										Current Expiry
									</span>
									<span className="text-sm font-medium">
										{subscription.expiryDate
											? new Date(subscription.expiryDate).toLocaleDateString()
											: "N/A"}
									</span>
								</div>
							</div>

							<div className="space-y-3">
								<Label htmlFor="billing-cycle">Select Billing Cycle</Label>
								<Select
									value={selectedCycle || undefined}
									onValueChange={handleCycleChange}
								>
									<SelectTrigger id="billing-cycle">
										<SelectValue placeholder="Choose billing cycle" />
									</SelectTrigger>
									<SelectContent>
										{availableCycles.map((cycle) => (
											<SelectItem key={cycle} value={cycle}>
												{formatBillingCycleLabel(cycle)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{selectedCycle && (
								<>
									<Separator />
									<div className="space-y-3 rounded-lg border bg-primary/5 p-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">Renewal Price</span>
											<span className="text-lg font-bold">
												{formatRenewalPrice(renewalPrice, currency)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-muted-foreground">
												Billing Cycle
											</span>
											<span className="text-sm font-medium">
												{formatBillingCycleLabel(selectedCycle)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-muted-foreground">
												New Expiry Date
											</span>
											<span className="text-sm font-bold text-green-600">
												{nextExpiry ? nextExpiry.toLocaleDateString() : "N/A"}
											</span>
										</div>
									</div>

									<div className="rounded-lg bg-muted/50 p-3">
										<p className="text-xs text-muted-foreground">
											<strong>Note:</strong> Price includes VAT (16%). Your subscription will
											be extended from today for the selected billing period.
										</p>
									</div>
								</>
							)}
						</div>
					)}

					{step === "payment" && (
						<div className="space-y-6 py-4">
							<div className="rounded-lg border bg-muted/50 p-4 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">Amount Due</span>
									<span className="text-xl font-bold">
										{formatRenewalPrice(renewalPrice, currency)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">New Expiry</span>
									<span className="text-sm font-medium text-green-600">
										{nextExpiry ? nextExpiry.toLocaleDateString() : "N/A"}
									</span>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<Label>Payment Method</Label>
								<PaymentMethodAccordion
									value={paymentMethod}
									onValueChange={setPaymentMethod}
									type="single"
									collapsible
								>
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
											{(createCheckout.isPending || createFromPayment.isPending) ? (
												<div className="py-8 flex flex-col items-center">
													<Spinner variant="ellipsis" size={48} className="mb-4 text-primary" />
													<p className="text-sm font-medium">
														{createCheckout.isPending ? "Sending payment request..." : "Processing renewal..."}
													</p>
												</div>
											) : (
												<div className="space-y-4">
													<MpesaPaymentFields
														currency={subscription?.agreedCurrency || "KES"}
														canEditPaymentDetails={isAgencyUser}
														phoneNumber={mpesaPhoneNumber}
														onPhoneNumberChange={(e) => setMpesaPhoneNumber(e.target.value)}
														amount={renewalPrice}
														onAmountChange={() => {}}
														amountHelperText={
															isAgencyUser
																? `Renewal total: ${formatRenewalPrice(renewalPrice, currency)} (editable)`
																: `Renewal total: ${formatRenewalPrice(renewalPrice, currency)}`
														}
														accountReference={mpesaAccountReference}
														onAccountReferenceChange={(e) => setMpesaAccountReference(e.target.value)}
														accountRefHelperText={`Reference (${mpesaAccountReference.length}/12)`}
														idPrefix="renewal-mpesa"
													/>
													<div className="flex justify-end pt-1">
														<MpesaPayButton
															onClick={handleMpesaPayment}
															disabled={
																createCheckout.isPending ||
																createFromPayment.isPending ||
																!mpesaPhoneNumber.trim() ||
																!validateMpesaAccountReference(mpesaAccountReference)
															}
														>
															{createCheckout.isPending || createFromPayment.isPending
																? "Processing..."
																: "Pay with M-Pesa"}
														</MpesaPayButton>
													</div>
												</div>
											)}
										</PaymentMethodContent>
									</PaymentMethodOption>

									{/* JENGA PAYMENT GATEWAY - COMMENTED OUT (NOT STABLE YET) */}
									{/* <PaymentMethodOption value="jenga_card">
										<PaymentMethodTrigger value="jenga_card" method="Credit/Debit Card" />
										<PaymentMethodContent>
											<JengaCardPaymentFields
												formState={jengaCustomerForm}
												onFormChange={setJengaCustomerForm}
											/>
										</PaymentMethodContent>
									</PaymentMethodOption> */}

									{isAgencyUser ? (
										<PaymentMethodOption
											value="manual"
											trigger={
												<PaymentMethodTrigger
													icon={<Receipt className="size-7 text-foreground" />}
													title="Record payment reference"
													description="M-Pesa receipt, bank transfer, or other external payment"
												/>
											}
										>
											<PaymentMethodContent>
												<div className="space-y-4">
													<p className="text-xs text-muted-foreground">
														Enter the transaction reference from the payment provider. This creates a successful
														payment record and completes the renewal (same as a confirmed M-Pesa payment).
													</p>
													<div className="space-y-2">
														<label className="text-sm font-medium">
															Transaction reference <span className="text-destructive">*</span>
														</label>
														<Input
															placeholder="e.g. SH12345678 or bank transfer ref"
															value={manualTransactionRef}
															onChange={(e) => setManualTransactionRef(e.target.value)}
															maxLength={64}
														/>
														<p className="text-xs text-muted-foreground">
															Must be unique. Used as the payment checkout ID for this renewal.
														</p>
													</div>
													<MpesaPaymentFields
														showPhone={false}
														currency={subscription?.agreedCurrency || "KES"}
														canEditPaymentDetails={isAgencyUser}
														phoneNumber=""
														onPhoneNumberChange={() => {}}
														amount={renewalPrice}
														onAmountChange={() => {}}
														amountHelperText={`Renewal total: ${formatRenewalPrice(renewalPrice, currency)}`}
														accountReference={mpesaAccountReference}
														onAccountReferenceChange={(e) => setMpesaAccountReference(e.target.value)}
														idPrefix="renewal-manual"
													/>
													<div className="flex justify-end pt-1">
														<Button
															onClick={handleManualRenewal}
															disabled={
																createFromPayment.isPending ||
																!manualTransactionRef.trim()
															}
														>
															{createFromPayment.isPending
																? "Processing…"
																: "Record payment & complete renewal"}
														</Button>
													</div>
												</div>
											</PaymentMethodContent>
										</PaymentMethodOption>
									) : null}
								</PaymentMethodAccordion>
							</div>
						</div>
					)}

					{step === "processing" && (
						<div className="flex flex-col items-center justify-center py-12 space-y-4">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
							<p className="text-sm text-muted-foreground">Processing your renewal...</p>
						</div>
					)}

					{step === "success" && (
						<div className="flex flex-col items-center justify-center py-12 space-y-4">
							<div className="rounded-full bg-green-100 p-3">
								<Receipt className="h-8 w-8 text-green-600" />
							</div>
							<h3 className="text-lg font-semibold">Renewal Successful!</h3>
							<p className="text-sm text-muted-foreground text-center max-w-md">
								Your subscription has been renewed and extended to{" "}
								<strong>{nextExpiry ? nextExpiry.toLocaleDateString() : "the new date"}</strong>.
							</p>
						</div>
					)}

					{step === "error" && (
						<div className="flex flex-col items-center justify-center py-12 space-y-4">
							<div className="rounded-full bg-red-100 p-3">
								<Receipt className="h-8 w-8 text-red-600" />
							</div>
							<h3 className="text-lg font-semibold">Renewal Failed</h3>
							<p className="text-sm text-muted-foreground text-center max-w-md">
								We couldn't process your renewal. Please try again or contact support.
							</p>
						</div>
					)}
				</ScrollArea>

				<DialogFooter>
					{step === "billing_cycle" && (
						<>
							<Button variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button onClick={handleContinueToPayment} disabled={!selectedCycle}>
								Continue to Payment
							</Button>
						</>
					)}

					{step === "payment" && (
						<Button variant="outline" onClick={() => setStep("billing_cycle")}>
							Back
						</Button>
					)}

					{(step === "success" || step === "error") && (
						<Button onClick={handleClose}>Close</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
