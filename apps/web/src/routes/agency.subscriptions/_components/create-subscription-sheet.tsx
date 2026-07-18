"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useUsersLookup } from "@/hooks/use-user-lookup";

const ZEEPO_TOKEN_OVERRIDE_KEY = "zeepoTokenGrantOverride";

const SERVICE_PRODUCT_IDS = [
	"zeepo_ai_agent",
	"nisc_email_marketing",
	"web_hosting",
	"email_hosting",
	"wordpress_hosting",
	"seo_reports",
	"creatives_design",
	"media_buying",
] as const;

type ServiceProductId = (typeof SERVICE_PRODUCT_IDS)[number];

type ServiceProductDef = {
	id: ServiceProductId;
	label: string;
	needsPlan: boolean;
	needsDomain: boolean;
	needsProvisionUser: boolean;
	supportsZeepoTokens: boolean;
	defaultBillingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
};

const SERVICE_PRODUCTS: ServiceProductDef[] = [
	{
		id: "zeepo_ai_agent",
		label: "Zeepo AI Agent",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: true,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "nisc_email_marketing",
		label: "Nisc Email Marketing",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "web_hosting",
		label: "Website Hosting",
		needsPlan: true,
		needsDomain: true,
		needsProvisionUser: true,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "email_hosting",
		label: "Email Hosting",
		needsPlan: true,
		needsDomain: true,
		needsProvisionUser: true,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "wordpress_hosting",
		label: "WordPress Hosting",
		needsPlan: true,
		/** DB subscription today; enable domain/Plesk fields when plans have pleskServicePlanId. */
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "seo_reports",
		label: "SEO Reports",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "creatives_design",
		label: "Creatives & Design",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
	{
		id: "media_buying",
		label: "Media Buying",
		needsPlan: true,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "MONTHLY",
	},
];

function getServiceDef(id: ServiceProductId): ServiceProductDef {
	return SERVICE_PRODUCTS.find((p) => p.id === id) ?? SERVICE_PRODUCTS[0]!;
}

/**
 * Normalize pasted domain/URL input for Plesk primary domain.
 * Strips protocol, path, query, port, trailing dots; lowercases.
 */
function normalizeDomainInput(value: string): string {
	let d = value.trim().toLowerCase();
	if (!d) return "";
	d = d.replace(/^https?:\/\//i, "");
	d = d.replace(/^\/\//, "");
	const slash = d.indexOf("/");
	if (slash !== -1) d = d.slice(0, slash);
	const q = d.indexOf("?");
	if (q !== -1) d = d.slice(0, q);
	const hash = d.indexOf("#");
	if (hash !== -1) d = d.slice(0, hash);
	// Strip port (example.com:443) but not IPv6 — we reject IPs separately.
	if (/^\[[^\]]+\]:\d+$/.test(d)) {
		d = d.replace(/:\d+$/, "");
	} else if (!d.includes("]") && /:\d+$/.test(d)) {
		d = d.replace(/:\d+$/, "");
	}
	d = d.replace(/\.+$/, "");
	return d.trim();
}

type DomainValidationResult =
	| { ok: true; normalized: string }
	| { ok: false; message: string };

/** Validate FQDN for Plesk webspace name identifier. */
function validateDomainName(value: string): DomainValidationResult {
	const raw = value.trim();
	if (!raw) {
		return { ok: false, message: "Enter a domain name (e.g. example.com)" };
	}
	if (/\s/.test(raw)) {
		return { ok: false, message: "Domain cannot contain spaces" };
	}
	if (/^https?:\/\//i.test(raw) || raw.includes("/") || raw.includes("?") || raw.includes("#")) {
		return {
			ok: false,
			message: "Enter only the domain name, not a full URL (e.g. example.com)",
		};
	}
	if (raw.includes("@")) {
		return { ok: false, message: "Enter a domain name, not an email address" };
	}
	if (raw.includes("_")) {
		return { ok: false, message: "Domain labels cannot contain underscores" };
	}
	if (raw.includes("..")) {
		return { ok: false, message: "Domain cannot contain consecutive dots" };
	}

	const d = normalizeDomainInput(raw);
	if (!d) {
		return { ok: false, message: "Enter a domain name (e.g. example.com)" };
	}
	if (d.length > 253) {
		return { ok: false, message: "Domain name is too long (max 253 characters)" };
	}
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d) || d.includes(":")) {
		return { ok: false, message: "Enter a domain name, not an IP address" };
	}
	if (d === "localhost" || d.endsWith(".localhost") || d.endsWith(".local")) {
		return { ok: false, message: "Localhost / .local names are not allowed" };
	}
	if (!d.includes(".")) {
		return {
			ok: false,
			message: "Enter a full domain with a TLD (e.g. example.com)",
		};
	}

	const labels = d.split(".");
	if (labels.length < 2) {
		return {
			ok: false,
			message: "Enter a full domain with a TLD (e.g. example.com)",
		};
	}

	const tld = labels[labels.length - 1]!;
	if (!/^[a-z]{2,63}$/.test(tld)) {
		return {
			ok: false,
			message: "TLD must be 2–63 letters (e.g. .com, .co.ke)",
		};
	}

	for (const label of labels) {
		if (!label) {
			return { ok: false, message: "Domain cannot have empty labels" };
		}
		if (label.length > 63) {
			return { ok: false, message: "Each domain label must be at most 63 characters" };
		}
		if (label.startsWith("-") || label.endsWith("-")) {
			return {
				ok: false,
				message: "Domain labels cannot start or end with a hyphen",
			};
		}
		if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label) && label.length > 1) {
			return {
				ok: false,
				message: "Domain can only contain letters, numbers, hyphens, and dots",
			};
		}
		if (label.length === 1 && !/^[a-z0-9]$/.test(label)) {
			return {
				ok: false,
				message: "Domain can only contain letters, numbers, hyphens, and dots",
			};
		}
	}

	if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(d)) {
		return {
			ok: false,
			message: "Enter a valid domain name (e.g. example.com or shop.example.co.ke)",
		};
	}

	return { ok: true, normalized: d };
}

function isValidDomainName(value: string): boolean {
	return validateDomainName(value).ok;
}

const createFormSchema = z
	.object({
		teamId: z.string().min(1, "Select a team"),
		serviceProduct: z.enum(SERVICE_PRODUCT_IDS),
		planId: z.string().optional(),
		provisionUserId: z.string().optional(),
		primaryDomain: z.string().optional(),
		amount: z.string().min(1, "Enter the payment amount"),
		overrideTokens: z.boolean(),
		tokenGrant: z.string().optional(),
		transactionReference: z
			.string()
			.trim()
			.min(3, "Transaction reference must be at least 3 characters")
			.max(120, "Transaction reference is too long"),
	})
	.superRefine((data, ctx) => {
		const def = getServiceDef(data.serviceProduct);

		const amount = Number.parseFloat(data.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			ctx.addIssue({
				code: "custom",
				message: "Amount must be a number greater than 0",
				path: ["amount"],
			});
		} else if (!Number.isInteger(amount)) {
			ctx.addIssue({
				code: "custom",
				message: "Amount must be a whole number (no decimals)",
				path: ["amount"],
			});
		}

		if (def.needsPlan && !data.planId?.trim()) {
			ctx.addIssue({ code: "custom", message: "Select a plan", path: ["planId"] });
		}

		if (def.needsProvisionUser && !data.provisionUserId?.trim()) {
			ctx.addIssue({
				code: "custom",
				message: "Select the user whose profile will be used for provisioning",
				path: ["provisionUserId"],
			});
		}

		if (def.needsDomain) {
			const result = validateDomainName(data.primaryDomain ?? "");
			if (!result.ok) {
				ctx.addIssue({
					code: "custom",
					message: result.message,
					path: ["primaryDomain"],
				});
			}
		}

		if (def.supportsZeepoTokens && data.overrideTokens) {
			const rawTokens = (data.tokenGrant ?? "").trim();
			if (!/^\d+$/.test(rawTokens)) {
				ctx.addIssue({
					code: "custom",
					message: "Enter a whole number of tokens (0 or more)",
					path: ["tokenGrant"],
				});
			}
		}
	});

type CreateFormData = z.infer<typeof createFormSchema>;

type CatalogPlanOption = {
	id: string;
	name: string;
	productId: string;
	productName: string;
	displayPrice: number;
	displayCurrency: string;
	billingCycle: string;
	zeepoPlanType?: string;
	tokenGrant?: number;
};

function normalizeBillingCycle(
	raw: string | null | undefined,
): "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" {
	const v = (raw ?? "MONTHLY").toUpperCase();
	if (v === "YEARLY" || v === "BIENNIALLY" || v === "CUSTOM") return v;
	return "MONTHLY";
}

function mapPricingPlans(
	plans: Array<{
		id: string;
		name: string;
		productId: string;
		productName: string;
		niscPrice: string | null;
		niscCurrency: string;
		billingCycle: string;
	}> | undefined,
): CatalogPlanOption[] {
	return (plans ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		productId: p.productId,
		productName: p.productName,
		displayPrice: Number.parseFloat(p.niscPrice ?? "0") || 0,
		displayCurrency: p.niscCurrency || "KES",
		billingCycle: p.billingCycle || "MONTHLY",
	}));
}

interface CreateSubscriptionSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
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
			serviceProduct: "zeepo_ai_agent",
			planId: "",
			provisionUserId: "",
			primaryDomain: "",
			amount: "",
			overrideTokens: false,
			tokenGrant: "",
			transactionReference: "",
		},
	});

	const watchedTeamId = form.watch("teamId");
	const watchedPlanId = form.watch("planId");
	const watchedOverride = form.watch("overrideTokens");
	const watchedServiceProduct = form.watch("serviceProduct");
	const watchedProvisionUserId = form.watch("provisionUserId");
	const watchedPrimaryDomain = form.watch("primaryDomain");
	const watchedAmount = form.watch("amount");
	const watchedTransactionReference = form.watch("transactionReference");

	const serviceDef = getServiceDef(watchedServiceProduct);

	const { data: teamMembers = [] } = trpc.teams.getMembers.useQuery(
		{ teamId: watchedTeamId },
		{ enabled: open && Boolean(watchedTeamId) },
	);

	const memberUserIds = React.useMemo(
		() => teamMembers.map((m) => m.userId),
		[teamMembers],
	);
	const { usersMap, isLoading: loadingUsers } = useUsersLookup(memberUserIds);

	const defaultOwnerUserId = React.useMemo(() => {
		return teamMembers.find((m) => m.role === "OWNER")?.userId ?? teamMembers[0]?.userId ?? "";
	}, [teamMembers]);

	React.useEffect(() => {
		if (!watchedTeamId) {
			form.setValue("provisionUserId", "");
			return;
		}
		if (defaultOwnerUserId) {
			form.setValue("provisionUserId", defaultOwnerUserId);
		}
	}, [watchedTeamId, defaultOwnerUserId, form]);

	const isZeepo = watchedServiceProduct === "zeepo_ai_agent";
	const isNiscEm = watchedServiceProduct === "nisc_email_marketing";
	const isWebHosting = watchedServiceProduct === "web_hosting";
	const isEmailHosting = watchedServiceProduct === "email_hosting";
	const isWordpress = watchedServiceProduct === "wordpress_hosting";
	const isSeo = watchedServiceProduct === "seo_reports";
	const isCreatives = watchedServiceProduct === "creatives_design";
	const isMediaBuying = watchedServiceProduct === "media_buying";

	const { data: zeepoPlansData, isLoading: loadingZeepoPlans } =
		trpc.zeepoAgent.billing.listPurchasePlans.useQuery(
			{ displayCurrency: "KES" },
			{ enabled: open && isZeepo },
		);

	const { data: niscEmPlansData, isLoading: loadingNiscEmPlans } =
		trpc.products.getNiscEmailMarketingPlansForPricing.useQuery(undefined, {
			enabled: open && isNiscEm,
		});

	const { data: webHostingPlansData, isLoading: loadingWebHostingPlans } =
		trpc.products.getHostingPlansForPricing.useQuery(undefined, {
			enabled: open && isWebHosting,
		});

	const { data: emailHostingPlansData, isLoading: loadingEmailHostingPlans } =
		trpc.products.getEmailHostingPlansForPricing.useQuery(undefined, {
			enabled: open && isEmailHosting,
		});

	const { data: wordpressPlansData, isLoading: loadingWordpressPlans } =
		trpc.products.getWordPressPlansForPricing.useQuery(undefined, {
			enabled: open && isWordpress,
		});

	const { data: seoPlansData, isLoading: loadingSeoPlans } =
		trpc.products.getSeoPlansForPricing.useQuery(undefined, {
			enabled: open && isSeo,
		});

	const { data: creativesPlansData, isLoading: loadingCreativesPlans } =
		trpc.products.getCreativesDesignPlansForPricing.useQuery(undefined, {
			enabled: open && isCreatives,
		});

	const { data: mediaBuyingPlansData, isLoading: loadingMediaBuyingPlans } =
		trpc.products.getMediaBuyingPlansForPricing.useQuery(undefined, {
			enabled: open && isMediaBuying,
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

	const planOptions = React.useMemo((): CatalogPlanOption[] => {
		switch (watchedServiceProduct) {
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
	}, [
		watchedServiceProduct,
		zeepoPlans,
		niscEmPlansData?.plans,
		webHostingPlansData?.plans,
		emailHostingPlansData?.plans,
		wordpressPlansData?.plans,
		seoPlansData?.plans,
		creativesPlansData?.plans,
		mediaBuyingPlansData?.plans,
	]);

	const loadingPlans =
		(isZeepo && loadingZeepoPlans) ||
		(isNiscEm && loadingNiscEmPlans) ||
		(isWebHosting && loadingWebHostingPlans) ||
		(isEmailHosting && loadingEmailHostingPlans) ||
		(isWordpress && loadingWordpressPlans) ||
		(isSeo && loadingSeoPlans) ||
		(isCreatives && loadingCreativesPlans) ||
		(isMediaBuying && loadingMediaBuyingPlans);

	const selectedPlan = React.useMemo(
		() => planOptions.find((p) => p.id === watchedPlanId) ?? null,
		[planOptions, watchedPlanId],
	);

	const displayCurrency = selectedPlan?.displayCurrency ?? "KES";

	const teamItems = React.useMemo((): ComboboxItem[] => {
		return teams.map((t) => ({
			id: t.id,
			label: t.name,
		}));
	}, [teams]);

	const provisionUserItems = React.useMemo((): ComboboxItem[] => {
		return teamMembers.map((m) => {
			const u = usersMap.get(m.userId);
			const name = u?.name || u?.email || m.userId.slice(0, 8);
			const roleSuffix = m.role === "OWNER" ? " (Owner)" : ` (${m.role})`;
			return {
				id: m.userId,
				label: `${name}${roleSuffix}`,
			};
		});
	}, [teamMembers, usersMap]);

	React.useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	React.useEffect(() => {
		form.setValue("planId", "");
		form.setValue("amount", "");
		form.setValue("overrideTokens", false);
		form.setValue("tokenGrant", "");
		form.setValue("primaryDomain", "");
	}, [watchedServiceProduct, form]);

	React.useEffect(() => {
		if (!selectedPlan) return;
		form.setValue("amount", String(Math.ceil(selectedPlan.displayPrice)));
		if (isZeepo && selectedPlan.tokenGrant != null && !form.getValues("overrideTokens")) {
			form.setValue("tokenGrant", String(selectedPlan.tokenGrant));
		}
	}, [selectedPlan, isZeepo, form]);

	const recordManualPayment = trpc.paymentTransactions.recordManual.useMutation();
	const createFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation();

	const [submitting, setSubmitting] = React.useState(false);

	const resolveProductId = React.useCallback((): string | null => {
		if (isZeepo) return zeepoPlansData?.productId ? String(zeepoPlansData.productId) : null;
		return selectedPlan?.productId ?? null;
	}, [isZeepo, zeepoPlansData?.productId, selectedPlan?.productId]);

	const onSubmit = form.handleSubmit(async (data) => {
		const def = getServiceDef(data.serviceProduct);
		const billedForUserId =
			data.provisionUserId?.trim() ||
			defaultOwnerUserId ||
			teamMembers.find((m) => m.role === "OWNER")?.userId ||
			teamMembers[0]?.userId;

		const productId = resolveProductId();
		if (!productId) {
			toast.error("Product is not available. Check that it is seeded and active.");
			return;
		}

		if (def.needsPlan && !selectedPlan) {
			toast.error("Select a valid plan.");
			return;
		}

		const amount = Math.ceil(Number.parseFloat(data.amount));
		const currency = selectedPlan?.displayCurrency || "KES";
		let primaryDomain: string | undefined;
		if (def.needsDomain) {
			const domainResult = validateDomainName(data.primaryDomain ?? "");
			if (!domainResult.ok) {
				toast.error(domainResult.message);
				form.setError("primaryDomain", { message: domainResult.message });
				return;
			}
			primaryDomain = domainResult.normalized;
		}
		const provisionUserId = billedForUserId || undefined;

		if (def.needsProvisionUser && !provisionUserId) {
			toast.error("Select the provisioning identity user.");
			form.setError("provisionUserId", {
				message: "Select the user whose profile will be used for provisioning",
			});
			return;
		}

		setSubmitting(true);
		try {
			const productLabel = def.label;
			const planLabel = selectedPlan?.name ?? primaryDomain ?? "order";

			const payment = await recordManualPayment.mutateAsync({
				transactionReference: data.transactionReference.trim(),
				amount,
				currency,
				teamId: data.teamId,
				transactionDesc: `Agency subscription: ${productLabel} - ${planLabel}`.slice(0, 200),
			});

			let billingCycle = def.defaultBillingCycle;
			if (selectedPlan) {
				billingCycle =
					selectedPlan.zeepoPlanType === "top_up"
						? "CUSTOM"
						: normalizeBillingCycle(selectedPlan.billingCycle);
			}

			const metadata: Record<string, unknown> = {};

			if (def.supportsZeepoTokens && data.overrideTokens && data.tokenGrant?.trim()) {
				metadata[ZEEPO_TOKEN_OVERRIDE_KEY] = Number.parseInt(data.tokenGrant, 10);
			}

			if (provisionUserId && def.needsProvisionUser) {
				metadata.provisionUserId = provisionUserId;
			}

			await createFromPayment.mutateAsync({
				checkoutRequestId: payment.checkoutRequestId,
				teamId: data.teamId,
				...(provisionUserId ? { billedForUserId: provisionUserId } : {}),
				currency,
				/** Agency manual provision — no invoice or customer order emails. */
				skipInvoice: true,
				items: [
					{
						productId,
						productPlanId: data.planId,
						billingCycle,
						itemPrice: String(amount),
						itemSubtotal: String(amount),
						description: selectedPlan?.name ?? def.label,
						...(primaryDomain ? { primaryDomain } : {}),
						...(Object.keys(metadata).length > 0 ? { metadata } : {}),
					},
				],
			});

			toast.success("Subscription created and provisioned for the customer.");
			onOpenChange(false);
			void utils.clientSubscriptions.listForAgency.invalidate();
			void utils.niscServiceOrders.getAll.invalidate();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not create subscription.";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	});

	const isBusy = submitting || recordManualPayment.isPending || createFromPayment.isPending;

	const canSubmit = React.useMemo(() => {
		if (!watchedTeamId || planOptions.length === 0 || !watchedPlanId) return false;
		const amount = Number.parseFloat(watchedAmount);
		if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) return false;
		if ((watchedTransactionReference?.trim().length ?? 0) < 3) return false;
		if (serviceDef.needsProvisionUser && !watchedProvisionUserId?.trim()) return false;
		if (serviceDef.needsDomain && !isValidDomainName(watchedPrimaryDomain ?? "")) return false;
		return true;
	}, [
		watchedTeamId,
		planOptions.length,
		watchedPlanId,
		watchedAmount,
		watchedTransactionReference,
		serviceDef.needsProvisionUser,
		serviceDef.needsDomain,
		watchedProvisionUserId,
		watchedPrimaryDomain,
	]);

	const selectedProvisionUser = provisionUserItems.find((i) => i.id === watchedProvisionUserId);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-2xl p-0 gap-0">
				<SheetHeader className="px-6 pt-6 pb-2">
					<SheetTitle>Create subscription</SheetTitle>
					<SheetDescription>
						Provision a service on behalf of a customer team. Payment is recorded for your
						records only — no invoice or customer order emails are sent.
					</SheetDescription>
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
												<FormLabel>Team</FormLabel>
												{loadingTeams ? (
													<Skeleton className="h-10 w-full" />
												) : (
													<ComboboxDropdown
														items={teamItems}
														selectedItem={teamItems.find((i) => i.id === field.value)}
														onSelect={(item) => field.onChange(item.id)}
														placeholder="Select team"
														searchPlaceholder="Search teams..."
														emptyResults="No teams found"
														disabled={isBusy}
													/>
												)}
												<FormDescription>
													Subscription is linked to this customer team.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{serviceDef.needsProvisionUser && watchedTeamId ? (
										<FormField
											control={form.control}
											name="provisionUserId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Provisioning identity</FormLabel>
													{loadingUsers && provisionUserItems.length === 0 ? (
														<Skeleton className="h-10 w-full" />
													) : (
														<ComboboxDropdown
															items={provisionUserItems}
															selectedItem={selectedProvisionUser}
															onSelect={(item) => field.onChange(item.id)}
															placeholder="Select user"
															searchPlaceholder="Search members..."
															emptyResults="No team members found"
															disabled={isBusy}
														/>
													)}
													<FormDescription>
														Defaults to the team owner. Profile details from this user are
														used when creating the third-party account (e.g. Plesk customer or
														domain registrant).
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									) : null}
								</section>

								<section className="space-y-4">
									<h3 className="text-sm font-medium">Service</h3>
									<FormField
										control={form.control}
										name="serviceProduct"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Product</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
													disabled={isBusy}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select product" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{SERVICE_PRODUCTS.map((product) => (
															<SelectItem key={product.id} value={product.id}>
																{product.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									{serviceDef.needsPlan ? (
										<FormField
											control={form.control}
											name="planId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Plan</FormLabel>
													{loadingPlans ? (
														<Skeleton className="h-10 w-full" />
													) : (
														<Select
															onValueChange={field.onChange}
															value={field.value}
															disabled={isBusy || planOptions.length === 0}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select plan" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{planOptions.map((plan) => (
																	<SelectItem key={plan.id} value={plan.id}>
																		{isZeepo ? (
																			<>
																				{plan.name} -{" "}
																				{(plan.tokenGrant ?? 0).toLocaleString()} tokens (
																				{plan.zeepoPlanType === "top_up"
																					? "top-up"
																					: "subscription"}
																				)
																			</>
																		) : (
																			<>
																				{plan.name} - {plan.displayCurrency}{" "}
																				{Math.ceil(plan.displayPrice).toLocaleString()} /{" "}
																				{plan.billingCycle.toLowerCase()}
																			</>
																		)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
													{selectedPlan && !isZeepo ? (
														<FormDescription>{selectedPlan.productName}</FormDescription>
													) : null}
													{!loadingPlans && planOptions.length === 0 ? (
														<FormDescription className="text-destructive">
															No active plans found for this product.
														</FormDescription>
													) : null}
													<FormMessage />
												</FormItem>
											)}
										/>
									) : null}

									{isZeepo && selectedPlan ? (
										<>
											<FormField
												control={form.control}
												name="overrideTokens"
												render={({ field }) => (
													<FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={(v) => {
																	field.onChange(Boolean(v));
																	if (v && selectedPlan.tokenGrant != null) {
																		form.setValue(
																			"tokenGrant",
																			String(selectedPlan.tokenGrant),
																		);
																	}
																}}
																disabled={isBusy}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel>Override token grant</FormLabel>
															<FormDescription>
																Plan includes {(selectedPlan.tokenGrant ?? 0).toLocaleString()}{" "}
																tokens. Override to grant a custom amount when provisioning.
															</FormDescription>
														</div>
													</FormItem>
												)}
											/>

											{watchedOverride ? (
												<FormField
													control={form.control}
													name="tokenGrant"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Tokens to grant</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min={0}
																	step={1}
																	placeholder={String(selectedPlan.tokenGrant ?? 0)}
																	{...field}
																	disabled={isBusy}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											) : null}
										</>
									) : null}

									{serviceDef.needsDomain ? (
										<FormField
											control={form.control}
											name="primaryDomain"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Plesk domain name</FormLabel>
													<FormControl>
														<Input
															placeholder="example.com"
															autoCapitalize="none"
															autoCorrect="off"
															spellCheck={false}
															inputMode="url"
															{...field}
															onChange={(e) => {
																field.onChange(e.target.value.trimStart());
															}}
															onBlur={(e) => {
																const result = validateDomainName(e.target.value);
																if (result.ok) {
																	field.onChange(result.normalized);
																} else {
																	const normalized = normalizeDomainInput(e.target.value);
																	if (normalized && normalized !== e.target.value) {
																		field.onChange(normalized);
																	}
																}
																field.onBlur();
																void form.trigger("primaryDomain");
															}}
															disabled={isBusy}
														/>
													</FormControl>
													<FormDescription>
														Valid FQDN only (e.g. example.com). Used as the Plesk webspace
														name — not a Domains subscription. No http://, paths, or IPs.
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									) : null}
								</section>

								<section className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<Receipt className="h-4 w-4" />
										Payment
									</h3>
									<FormField
										control={form.control}
										name="amount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Amount ({displayCurrency})</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														step={1}
														inputMode="numeric"
														{...field}
														onBlur={(e) => {
															const n = Number.parseFloat(e.target.value);
															if (Number.isFinite(n) && n > 0) {
																field.onChange(String(Math.ceil(n)));
															}
															field.onBlur();
															void form.trigger("amount");
														}}
														disabled={isBusy}
													/>
												</FormControl>
												<FormDescription>
													Whole-number amount in {displayCurrency} (prefilled from plan;
													editable). No invoice is generated.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
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
														disabled={isBusy}
													/>
												</FormControl>
												<FormDescription>
													External payment reference (M-Pesa, bank transfer, etc.) for internal
													records only.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</section>
							</div>
						</ScrollArea>

						<SheetFooter className="flex-shrink-0 flex-wrap gap-2 px-6 py-4 border-t bg-muted/30">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isBusy}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isBusy || !canSubmit}>
								{isBusy ? (
									<>
										<Spinner size={16} className="mr-2" />
										Processing…
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Create subscription
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
