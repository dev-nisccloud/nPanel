"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Plus, Receipt } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { useUsersLookup } from "@/hooks/use-user-lookup";
import { SubscriptionProductLine } from "./subscription-product-line";
import {
	buildPaymentItems,
	createFormSchema,
	duplicateDomainMessage,
	emptyLine,
	formatMoney,
	getMpesaUserFriendlyError,
	getServiceDef,
	lineSummaryLabel,
	MAX_PRODUCT_LINES,
	mapPricingPlans,
	orderTotalsFromQuotes,
	quoteLine,
	resolveLineProductId,
	type CatalogPlanOption,
	type CreateFormData,
	type PaymentLineItem,
	type ServiceProductId,
} from "./create-subscription-order";

interface CreateSubscriptionSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function firstErrorMessage(errors: FieldErrors<CreateFormData>): string | undefined {
	const stack: unknown[] = [errors];
	const seen = new Set<unknown>();
	let visited = 0;
	while (stack.length > 0 && visited < 200) {
		const value = stack.pop();
		visited += 1;
		if (!value || typeof value !== "object" || seen.has(value)) continue;
		seen.add(value);
		if ("message" in value && typeof value.message === "string" && value.message) return value.message;
		if (Array.isArray(value)) {
			for (let i = value.length - 1; i >= 0; i -= 1) stack.push(value[i]);
			continue;
		}
		for (const [key, child] of Object.entries(value)) {
			if (key === "ref" || key === "type" || key === "types") continue;
			stack.push(child);
		}
	}
	return undefined;
}

export function CreateSubscriptionSheet({ open, onOpenChange }: CreateSubscriptionSheetProps) {
	const utils = trpc.useUtils();
	const { data: teams = [], isLoading: loadingTeams } = trpc.teams.getAll.useQuery(undefined, {
		enabled: open,
	});

	const form = useForm<CreateFormData>({
		resolver: zodResolver(createFormSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: {
			teamId: "",
			customerUserId: "",
			lines: [emptyLine()],
			amount: "",
			createInvoice: false,
			transactionReference: "",
			gateway: "MPESA",
			useStkPush: false,
			mpesaPhoneNumber: "",
		},
	});
	const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

	const watchedTeamId = form.watch("teamId");
	const watchedCustomerId = form.watch("customerUserId");
	const watchedLines = useWatch({ control: form.control, name: "lines" });
	const watchedAmount = form.watch("amount");
	const watchedGateway = form.watch("gateway");
	const watchedUseStkPush = form.watch("useStkPush");
	const watchedPhone = form.watch("mpesaPhoneNumber");
	const watchedReference = form.watch("transactionReference");
	const lines = watchedLines ?? [];

	const uses = React.useCallback(
		(id: ServiceProductId) => lines.some((line) => line.serviceProduct === id),
		[lines],
	);
	const needsDomains = lines.some((line) => getServiceDef(line.serviceProduct).needsDomain);
	const needsHostingProfile = lines.some((line) => getServiceDef(line.serviceProduct).needsProvisionUser);

	const [paymentError, setPaymentError] = React.useState<string | null>(null);
	const [isAwaitingPayment, setIsAwaitingPayment] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
	const pollingQuickRetryRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const terminalStateDetectedRef = React.useRef(false);
	const pollAttemptsRef = React.useRef(0);
	const pollInFlightRef = React.useRef(false);
	const orderFinishedRef = React.useRef(false);
	const pendingBuiltRef = React.useRef<{
		items: PaymentLineItem[];
		currency: string;
		billedForUserId: string;
		teamId: string;
		createInvoice: boolean;
		lineCount: number;
	} | null>(null);

	const stopPolling = React.useCallback(() => {
		if (pollingQuickRetryRef.current !== null) {
			clearTimeout(pollingQuickRetryRef.current);
			pollingQuickRetryRef.current = null;
		}
		if (pollingIntervalRef.current !== null) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
	}, []);

	const { data: teamMembers = [] } = trpc.teams.getMembers.useQuery(
		{ teamId: watchedTeamId },
		{ enabled: open && Boolean(watchedTeamId) },
	);
	const { data: opDomainsData, isLoading: loadingOpDomains } = trpc.openProvider.domains.list.useQuery(
		{ limit: 1000, offset: 0, with_customer_info: false },
		{ enabled: open && needsDomains, refetchOnWindowFocus: false },
	);
	const { data: kenicDomainsData, isLoading: loadingKenicDomains } = trpc.kenic.domainList.list.useQuery(
		{},
		{ enabled: open && needsDomains, refetchOnWindowFocus: false },
	);
	const loadingDomains = loadingOpDomains || loadingKenicDomains;

	const allDomains = React.useMemo(() => {
		const normalize = (name: string) => name.trim().toLowerCase().replace(/\.$/, "");
		const kenicDomains = (kenicDomainsData?.data ?? []).map((d: { id: string | number; domain: string }) => ({
			id: String(d.id),
			domainName: d.domain,
		}));
		const kenicNames = new Set(kenicDomains.map((d) => normalize(d.domainName)));
		const opDomains = (opDomainsData?.data ?? [])
			.filter((d: { domain: string }) => {
				const name = normalize(d.domain);
				if (name.endsWith(".ke") && kenicNames.has(name)) return false;
				return true;
			})
			.map((d: { id: string | number; domain: string }) => ({
				id: String(d.id),
				domainName: d.domain,
			}));
		return [...opDomains, ...kenicDomains];
	}, [opDomainsData?.data, kenicDomainsData?.data]);

	const memberUserIds = React.useMemo(() => teamMembers.map((m) => m.userId), [teamMembers]);
	const { usersMap, isLoading: loadingUsers } = useUsersLookup(memberUserIds);
	const defaultOwnerUserId = React.useMemo(
		() => teamMembers.find((m) => m.role === "OWNER")?.userId ?? teamMembers[0]?.userId ?? "",
		[teamMembers],
	);

	const memberIdsKey = memberUserIds.join("\0");

	React.useEffect(() => {
		if (!watchedTeamId) {
			if (form.getValues("customerUserId")) form.setValue("customerUserId", "");
			return;
		}
		const current = form.getValues("customerUserId");
		const stillMember = memberIdsKey.split("\0").filter(Boolean).includes(current);
		if ((!current || !stillMember) && defaultOwnerUserId && current !== defaultOwnerUserId) {
			form.setValue("customerUserId", defaultOwnerUserId);
		}
	}, [watchedTeamId, defaultOwnerUserId, memberIdsKey, form]);

	const { data: zeepoPlansData, isLoading: loadingZeepoPlans } = trpc.zeepoAgent.billing.listPurchasePlans.useQuery(
		{ displayCurrency: "KES" },
		{ enabled: open && uses("zeepo_ai_agent") },
	);
	const { data: niscEmPlansData, isLoading: loadingNiscEmPlans } =
		trpc.products.getNiscEmailMarketingPlansForPricing.useQuery(undefined, {
			enabled: open && uses("nisc_email_marketing"),
		});
	const { data: webHostingPlansData, isLoading: loadingWebHostingPlans } =
		trpc.products.getHostingPlansForPricing.useQuery(undefined, {
			enabled: open && uses("web_hosting"),
		});
	const { data: emailHostingPlansData, isLoading: loadingEmailHostingPlans } =
		trpc.products.getEmailHostingPlansForPricing.useQuery(undefined, {
			enabled: open && uses("email_hosting"),
		});
	const { data: wordpressPlansData, isLoading: loadingWordpressPlans } =
		trpc.products.getWordPressPlansForPricing.useQuery(undefined, {
			enabled: open && uses("wordpress_hosting"),
		});
	const { data: seoPlansData, isLoading: loadingSeoPlans } = trpc.products.getSeoPlansForPricing.useQuery(
		undefined,
		{ enabled: open && uses("seo_reports") },
	);
	const { data: creativesPlansData, isLoading: loadingCreativesPlans } =
		trpc.products.getCreativesDesignPlansForPricing.useQuery(undefined, {
			enabled: open && uses("creatives_design"),
		});
	const { data: mediaBuyingPlansData, isLoading: loadingMediaBuyingPlans } =
		trpc.products.getMediaBuyingPlansForPricing.useQuery(undefined, {
			enabled: open && uses("media_buying"),
		});
	const { data: oneTimeProductId } = trpc.clientSubscriptions.getOneTimeServicesProductId.useQuery(undefined, {
		enabled: open && uses("one_time_service"),
	});

	const zeepoPlans = React.useMemo((): CatalogPlanOption[] => {
		return (zeepoPlansData?.data ?? [])
			.filter((p) => String(p.zeepoPlanType ?? "") !== "pay_as_you_go")
			.map((p) => ({
				id: String(p.id),
				name: String(p.name),
				productId: String(zeepoPlansData?.productId ?? ""),
				productName: "Zeepo AI Agent",
				displayPrice:
					typeof p.displayPrice === "number"
						? p.displayPrice
						: Number.parseFloat(String(p.displayPrice ?? "0")) || 0,
				displayCurrency: String(p.displayCurrency ?? "KES"),
				billingCycle: p.billingCycle != null ? String(p.billingCycle) : "MONTHLY",
				zeepoPlanType: String(p.zeepoPlanType ?? "subscription"),
				tokenGrant:
					typeof p.tokenGrant === "number"
						? p.tokenGrant
						: Number.parseInt(String(p.tokenGrant ?? "0"), 10) || 0,
			}));
	}, [zeepoPlansData]);

	const plansFor = React.useCallback(
		(id: ServiceProductId): CatalogPlanOption[] => {
			switch (id) {
				case "zeepo_ai_agent":
					return zeepoPlans;
				case "nisc_email_marketing":
					return mapPricingPlans(niscEmPlansData?.plans);
				case "web_hosting":
					return mapPricingPlans(webHostingPlansData?.plans);
				case "email_hosting":
					return mapPricingPlans(emailHostingPlansData?.plans);
				case "wordpress_hosting":
					return mapPricingPlans(wordpressPlansData?.plans);
				case "seo_reports":
					return mapPricingPlans(seoPlansData?.plans);
				case "creatives_design":
					return mapPricingPlans(creativesPlansData?.plans);
				case "media_buying":
					return mapPricingPlans(mediaBuyingPlansData?.plans);
				default:
					return [];
			}
		},
		[
			zeepoPlans,
			niscEmPlansData?.plans,
			webHostingPlansData?.plans,
			emailHostingPlansData?.plans,
			wordpressPlansData?.plans,
			seoPlansData?.plans,
			creativesPlansData?.plans,
			mediaBuyingPlansData?.plans,
		],
	);

	const loadingFor = React.useCallback(
		(id: ServiceProductId) => {
			switch (id) {
				case "zeepo_ai_agent":
					return loadingZeepoPlans;
				case "nisc_email_marketing":
					return loadingNiscEmPlans;
				case "web_hosting":
					return loadingWebHostingPlans;
				case "email_hosting":
					return loadingEmailHostingPlans;
				case "wordpress_hosting":
					return loadingWordpressPlans;
				case "seo_reports":
					return loadingSeoPlans;
				case "creatives_design":
					return loadingCreativesPlans;
				case "media_buying":
					return loadingMediaBuyingPlans;
				default:
					return false;
			}
		},
		[
			loadingZeepoPlans,
			loadingNiscEmPlans,
			loadingWebHostingPlans,
			loadingEmailHostingPlans,
			loadingWordpressPlans,
			loadingSeoPlans,
			loadingCreativesPlans,
			loadingMediaBuyingPlans,
		],
	);

	const hostingProductIdFor = React.useCallback(
		(id: ServiceProductId) => plansFor(id)[0]?.productId ?? null,
		[plansFor],
	);

	const quotes = React.useMemo(
		() => lines.map((line) => quoteLine(line, plansFor(line.serviceProduct))),
		[lines, plansFor],
	);
	const totals = React.useMemo(() => orderTotalsFromQuotes(quotes), [quotes]);
	const zeepoCount = lines.filter((line) => line.serviceProduct === "zeepo_ai_agent").length;
	const catalogIds = React.useMemo(
		() => ({
			oneTimeProductId: oneTimeProductId ? String(oneTimeProductId) : null,
			zeepoProductId: zeepoPlansData?.productId ? String(zeepoPlansData.productId) : null,
		}),
		[oneTimeProductId, zeepoPlansData?.productId],
	);

	React.useEffect(() => {
		if (totals.totalIncVat <= 0) return;
		const next = String(totals.totalIncVat);
		if (form.getValues("amount") === next) return;
		form.setValue("amount", next, { shouldValidate: true });
	}, [totals.totalIncVat, form]);

	React.useEffect(() => {
		if (open) return;
		form.reset();
		stopPolling();
		terminalStateDetectedRef.current = false;
		pollAttemptsRef.current = 0;
		pendingBuiltRef.current = null;
		orderFinishedRef.current = false;
		setPaymentError(null);
		setIsAwaitingPayment(false);
		setSubmitting(false);
	}, [open, form, stopPolling]);

	React.useEffect(() => () => stopPolling(), [stopPolling]);

	const recordManualPayment = trpc.paymentTransactions.recordManual.useMutation();
	const createFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation();

	const finishOrder = React.useCallback(
		async (checkoutRequestIdValue: string) => {
			if (orderFinishedRef.current) return;
			orderFinishedRef.current = true;
			const pending = pendingBuiltRef.current;
			if (!pending) {
				orderFinishedRef.current = false;
				throw new Error("Product details were lost. Start the payment again.");
			}
			try {
				await createFromPayment.mutateAsync({
					checkoutRequestId: checkoutRequestIdValue,
					teamId: pending.teamId,
					billedForUserId: pending.billedForUserId,
					currency: pending.currency,
					skipInvoice: !pending.createInvoice,
					items: pending.items,
				});
			} catch (err) {
				orderFinishedRef.current = false;
				throw err;
			}
			const count = pending.lineCount;
			toast.success(
				count === 1
					? "Subscription created and provisioned for the customer."
					: `${count} subscriptions created on one order for this customer.`,
			);
			captureEvent("subscription_created", { lineCount: count });
			pendingBuiltRef.current = null;
			setIsAwaitingPayment(false);
			setSubmitting(false);
			onOpenChange(false);
			void utils.clientSubscriptions.listForAgency.invalidate();
			void utils.niscServiceOrders.getAll.invalidate();
		},
		[createFromPayment, onOpenChange, utils],
	);

	const handlePaymentFailure = React.useCallback(
		(message: string) => {
			stopPolling();
			terminalStateDetectedRef.current = true;
			pendingBuiltRef.current = null;
			setPaymentError(message);
			setIsAwaitingPayment(false);
			setSubmitting(false);
			toast.error(message);
		},
		[stopPolling],
	);

	const handlePaymentSuccess = React.useCallback(
		async (id: string) => {
			stopPolling();
			terminalStateDetectedRef.current = true;
			setPaymentError(null);
			try {
				await finishOrder(id);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to create subscription.";
				setIsAwaitingPayment(false);
				setPaymentError(message);
				setSubmitting(false);
				toast.error(message);
			}
		},
		[stopPolling, finishOrder],
	);

	const startPolling = React.useCallback(
		(id: string) => {
			stopPolling();
			terminalStateDetectedRef.current = false;
			pollAttemptsRef.current = 0;
			setIsAwaitingPayment(true);
			setPaymentError(null);

			const poll = async (): Promise<boolean> => {
				if (terminalStateDetectedRef.current) return true;
				if (pollInFlightRef.current) return false;
				pollInFlightRef.current = true;
				try {
					const res = await utils.client.paymentGateway.mpesa.queryStkPush.query({ checkoutRequestId: id });
					const resultCode = res.data?.resultCode ? Number.parseInt(res.data.resultCode, 10) : null;
					const resultDesc = res.data?.resultDesc;
					if (resultCode === null) return false;
					if (resultCode === 1037 || resultCode === 4999) return false;
					if (resultCode === 0) {
						terminalStateDetectedRef.current = true;
						void handlePaymentSuccess(id);
						return true;
					}
					handlePaymentFailure(getMpesaUserFriendlyError(resultCode, resultDesc));
					return true;
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					const isAuthError =
						message.includes("UNAUTHORIZED") ||
						message.includes("Authentication") ||
						message.includes("session") ||
						message.includes("Session expired");
					if (isAuthError) {
						handlePaymentFailure("Your session may have expired. Please restart.");
						return true;
					}
					return false;
				} finally {
					pollInFlightRef.current = false;
				}
			};

			void poll().then((finished) => {
				if (finished) return;
				pollAttemptsRef.current = 1;
				pollingQuickRetryRef.current = setTimeout(async () => {
					pollingQuickRetryRef.current = null;
					if (terminalStateDetectedRef.current) return;
					pollAttemptsRef.current += 1;
					const done = await poll();
					if (done) return;
					const intervalId = setInterval(() => {
						if (terminalStateDetectedRef.current) {
							stopPolling();
							return;
						}
						if (pollInFlightRef.current) return;
						pollAttemptsRef.current += 1;
						void poll().then((finishedAgain) => {
							if (!finishedAgain && pollAttemptsRef.current < 90) return;
							stopPolling();
							if (!finishedAgain && pollAttemptsRef.current >= 90) {
								handlePaymentFailure(
									"Payment is taking longer than expected. Please check M-Pesa or try again.",
								);
							}
						});
					}, 1000);
					pollingIntervalRef.current = intervalId;
				}, 1000);
			});
		},
		[stopPolling, handlePaymentFailure, handlePaymentSuccess, utils],
	);

	const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
		onError: (error) => {
			toast.error(error.message || "Failed to initiate M-Pesa payment");
			pendingBuiltRef.current = null;
			setIsAwaitingPayment(false);
			setSubmitting(false);
			setPaymentError(error.message);
		},
	});

	const prepareOrder = (data: CreateFormData) => {
		const billedForUserId = data.customerUserId.trim();
		if (!billedForUserId) return { ok: false as const, error: "Select the customer." };
		const built = buildPaymentItems({
			data,
			plansFor,
			oneTimeProductId: catalogIds.oneTimeProductId,
			zeepoProductId: catalogIds.zeepoProductId,
			billedForUserId,
		});
		if (!built.ok) return built;
		pendingBuiltRef.current = {
			items: built.items,
			currency: built.currency,
			billedForUserId,
			teamId: data.teamId,
			createInvoice: data.createInvoice,
			lineCount: data.lines.length,
		};
		return { ok: true as const, billedForUserId, currency: built.currency, amount: Math.ceil(Number.parseFloat(data.amount)) };
	};

	const onSubmit = form.handleSubmit(
		async (data) => {
			orderFinishedRef.current = false;
			const prepared = prepareOrder(data);
			if (!prepared.ok) {
				toast.error(prepared.error);
				return;
			}
			const amount = prepared.amount;
			const labels = data.lines.map((line) => getServiceDef(line.serviceProduct).label);

			if (data.useStkPush && data.gateway === "MPESA") {
				setIsAwaitingPayment(true);
				setSubmitting(true);
				try {
					const response = await initiateMpesaPayment.mutateAsync({
						phoneNumber: data.mpesaPhoneNumber?.trim() || "",
						amount,
						accountReference: `SUB${Date.now().toString().slice(-8)}`,
						transactionDesc: (labels.length > 1 ? `${labels.length} products` : labels[0] ?? "Subscription").slice(
							0,
							13,
						),
						checkoutTotalIncVat: amount,
						teamId: data.teamId,
						billedForUserId: prepared.billedForUserId,
					});
					const checkoutId = response.data?.checkoutRequestId;
					if (!checkoutId) {
						pendingBuiltRef.current = null;
						toast.error("Payment request sent but failed to get transaction ID.");
						setIsAwaitingPayment(false);
						setSubmitting(false);
						return;
					}
					setPaymentError(null);
					toast.message("Check the customer's phone for the M-Pesa prompt.");
					startPolling(checkoutId);
				} catch {
					pendingBuiltRef.current = null;
					setSubmitting(false);
				}
				return;
			}

			setSubmitting(true);
			try {
				const summary = labels.length === 1 ? labels[0] : `${labels.length} products (${labels.join(", ")})`;
				const payment = await recordManualPayment.mutateAsync({
					transactionReference: (data.transactionReference || "MANUAL").trim(),
					amount,
					currency: prepared.currency,
					gateway: data.gateway,
					teamId: data.teamId,
					transactionDesc: `Agency subscription: ${summary}`.slice(0, 200),
					billedForUserId: prepared.billedForUserId,
				});
				await finishOrder(payment.checkoutRequestId);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Could not create subscription.";
				toast.error(message);
			} finally {
				setSubmitting(false);
			}
		},
		(errors) => {
			toast.error(firstErrorMessage(errors) ?? "Please fill in all required fields correctly");
		},
	);

	const isBusy =
		submitting || recordManualPayment.isPending || createFromPayment.isPending || initiateMpesaPayment.isPending;

	const canSubmit = React.useMemo(() => {
		if (!watchedTeamId || !watchedCustomerId) return false;
		if (!totals.allReady || zeepoCount > 1) return false;
		if (lines.some((_, index) => duplicateDomainMessage(lines, index))) return false;
		const amount = Number.parseFloat(watchedAmount);
		if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) return false;
		if (watchedUseStkPush && watchedGateway === "MPESA") {
			if ((watchedPhone ?? "").replace(/\D/g, "").length < 10) return false;
		} else if ((watchedReference ?? "").trim().length < 3) return false;
		return lines.every((line, index) => {
			const productId = resolveLineProductId(line, quotes[index]!, catalogIds);
			return Boolean(productId);
		});
	}, [
		watchedTeamId,
		watchedCustomerId,
		totals.allReady,
		zeepoCount,
		lines,
		watchedAmount,
		watchedUseStkPush,
		watchedGateway,
		watchedPhone,
		watchedReference,
		quotes,
		catalogIds,
	]);

	const teamItems = React.useMemo((): ComboboxItem[] => teams.map((team) => ({ id: team.id, label: team.name })), [teams]);
	const customerItems = React.useMemo((): ComboboxItem[] => {
		return teamMembers.map((member) => {
			const user = usersMap.get(member.userId);
			const name = user?.name || user?.email || member.userId.slice(0, 8);
			const roleSuffix = member.role === "OWNER" ? " (Owner)" : ` (${member.role})`;
			return { id: member.userId, label: `${name}${roleSuffix}` };
		});
	}, [teamMembers, usersMap]);
	const domainItems = React.useMemo(
		(): ComboboxItem[] => allDomains.map((domain) => ({ id: domain.id, label: domain.domainName })),
		[allDomains],
	);
	const selectedCustomer = customerItems.find((item) => item.id === watchedCustomerId);
	const lineCount = Math.max(lines.length, 1);
	const stk = watchedUseStkPush && watchedGateway === "MPESA";
	const currency = quotes.find((quote) => quote.currency)?.currency || "KES";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-3xl p-0 gap-0">
				<SheetHeader className="px-6 pt-6 pb-2">
					<SheetTitle>Create subscription</SheetTitle>
					<SheetDescription>Subscribe a customer and collect payment for every product on this order.</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
						<ScrollArea className="flex-1 px-6">
							<div className="space-y-6 py-4 pb-6">
								<section className="space-y-4">
									<h3 className="text-sm font-medium">Customer</h3>
									<FormField
										control={form.control}
										name="teamId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Organization</FormLabel>
												{loadingTeams ? (
													<Skeleton className="h-10 w-full" />
												) : (
													<ComboboxDropdown
														items={teamItems}
														selectedItem={teamItems.find((item) => item.id === field.value)}
														onSelect={(item) => field.onChange(item.id)}
														placeholder="Select organization"
														searchPlaceholder="Search organizations..."
														emptyResults="No organizations found"
														disabled={isBusy}
													/>
												)}
												<FormDescription>The organization that owns these subscriptions.</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									{watchedTeamId ? (
										<FormField
											control={form.control}
											name="customerUserId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Customer</FormLabel>
													{loadingUsers && customerItems.length === 0 ? (
														<Skeleton className="h-10 w-full" />
													) : (
														<ComboboxDropdown
															items={customerItems}
															selectedItem={selectedCustomer}
															onSelect={(item) => field.onChange(item.id)}
															placeholder="Select customer"
															searchPlaceholder="Search members..."
															emptyResults="No organization members found"
															disabled={isBusy}
														/>
													)}
													<FormDescription>
														{needsHostingProfile
															? "Billed to this person. Hosting is set up on their account."
															: "The person these subscriptions are billed to."}
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									) : null}
								</section>

								<section className="space-y-4">
									<div className="flex items-center justify-between gap-2">
										<div>
											<h3 className="text-sm font-medium">Products</h3>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={isBusy || fields.length >= MAX_PRODUCT_LINES}
											onClick={() => {
												if (fields.length >= MAX_PRODUCT_LINES) return;
												append(emptyLine("nisc_email_marketing"));
											}}
										>
											<Plus className="mr-2 h-4 w-4" />
											Add product
										</Button>
									</div>
									{fields.map((field, index) => {
										const line = lines[index];
										if (!line) return null;
										const notice =
											line.serviceProduct === "zeepo_ai_agent" && zeepoCount > 1
												? "Zeepo can only be added once for this organization."
												: duplicateDomainMessage(lines, index);
										return (
											<SubscriptionProductLine
												key={field.id}
												index={index}
												line={line}
												form={form}
												quote={quotes[index]!}
												plans={plansFor(line.serviceProduct)}
												plansLoading={loadingFor(line.serviceProduct)}
												hostingProductId={hostingProductIdFor(line.serviceProduct)}
												open={open}
												isBusy={isBusy}
												canRemove={fields.length > 1}
												onRemove={() => remove(index)}
												domainItems={domainItems}
												allDomains={allDomains}
												loadingDomains={loadingDomains}
												notice={notice}
											/>
										);
									})}
								</section>

								<section className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<Receipt className="h-4 w-4" />
										Payment
									</h3>
									<div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
										<div className="space-y-1.5">
											{lines.map((line, index) => {
												const quote = quotes[index];
												return (
													<div key={fields[index]?.id ?? index} className="flex items-center justify-between text-sm gap-3">
														<span className="text-muted-foreground">{lineSummaryLabel(line, quote!)}</span>
														<span className="font-medium">
															{quote && quote.exVat > 0 ? formatMoney(quote.exVat, quote.currency) : "—"}
														</span>
													</div>
												);
											})}
										</div>
										<div className="space-y-1.5 pt-2 border-t">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Subtotal</span>
												<span className="font-medium">{formatMoney(totals.subtotalExVat, currency)}</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Tax (16%)</span>
												<span className="font-medium">{formatMoney(totals.vatAmount, currency)}</span>
											</div>
										</div>
										<div className="flex items-center justify-between pt-2 border-t">
											<span className="text-sm font-medium text-muted-foreground">Total</span>
											<span className="text-2xl font-bold text-primary">
												{formatMoney(totals.totalIncVat, currency)}
											</span>
										</div>
									</div>

									<FormField
										control={form.control}
										name="amount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Amount ({currency})</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														step={1}
														inputMode="numeric"
														{...field}
														onBlur={(event) => {
															const n = Number.parseFloat(event.target.value);
															if (Number.isFinite(n) && n > 0) field.onChange(String(Math.ceil(n)));
															field.onBlur();
															void form.trigger("amount");
														}}
														disabled={isBusy}
													/>
												</FormControl>
												<FormDescription>Total due, including tax. Lower it for a part payment.</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="gateway"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Payment method</FormLabel>
												<Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select payment method" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="MPESA">M-Pesa</SelectItem>
														<SelectItem value="JENGA">Card (Jenga)</SelectItem>
														<SelectItem value="OTHER">Other / Manual</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription>How this payment is received.</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{watchedGateway === "MPESA" ? (
										<>
											<FormField
												control={form.control}
												name="useStkPush"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
																disabled={isBusy || isAwaitingPayment}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel>Send STK push to customer</FormLabel>
															<FormDescription>The customer approves the charge on their phone.</FormDescription>
														</div>
													</FormItem>
												)}
											/>
											{watchedUseStkPush ? (
												<FormField
													control={form.control}
													name="mpesaPhoneNumber"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Customer M-Pesa phone number</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. 0712345678 or 254712345678"
																	{...field}
																	value={field.value ?? ""}
																	disabled={isBusy || isAwaitingPayment}
																/>
															</FormControl>
															<FormDescription>The number that receives the prompt.</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											) : null}
										</>
									) : null}

									{!watchedUseStkPush || watchedGateway !== "MPESA" ? (
										<FormField
											control={form.control}
											name="transactionReference"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Payment reference</FormLabel>
													<FormControl>
														<Input
															placeholder="M-Pesa receipt, bank ref, etc."
															{...field}
															value={field.value ?? ""}
															disabled={isBusy}
														/>
													</FormControl>
													<FormDescription>Receipt or transfer reference.</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									) : null}

									<FormField
										control={form.control}
										name="createInvoice"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
												<FormControl>
													<Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} />
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Create invoice and send order confirmation</FormLabel>
													<FormDescription>Email an invoice and order confirmation to the customer.</FormDescription>
												</div>
											</FormItem>
										)}
									/>
								</section>
							</div>
						</ScrollArea>

						<SheetFooter className="flex-shrink-0 flex-wrap gap-2 px-6 py-4 border-t bg-muted/30">
							{isAwaitingPayment ? (
								<div className="w-full flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
									<Spinner size={16} />
									<span>Waiting for the customer to complete M-Pesa payment...</span>
								</div>
							) : null}
							{paymentError ? (
								<div className="w-full rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
									{paymentError}
								</div>
							) : null}
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									if (isAwaitingPayment) {
										stopPolling();
										pendingBuiltRef.current = null;
										setIsAwaitingPayment(false);
										setSubmitting(false);
									}
									onOpenChange(false);
								}}
								disabled={isBusy && !isAwaitingPayment}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isBusy || !canSubmit || isAwaitingPayment}>
								{isBusy && !isAwaitingPayment ? (
									<>
										<Spinner size={16} className="mr-2" />
										{stk ? "Sending payment prompt…" : "Processing…"}
									</>
								) : isAwaitingPayment ? (
									<>
										<Spinner size={16} className="mr-2" />
										Awaiting payment…
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										{stk ? "Send payment prompt" : lineCount > 1 ? `Create ${lineCount} subscriptions` : "Create subscription"}
									</>
								)}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
