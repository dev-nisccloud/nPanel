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
import { captureEvent } from "@/lib/posthog";
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
	"one_time_service",
] as const;

type ServiceProductId = (typeof SERVICE_PRODUCT_IDS)[number];

type ServiceProductDef = {
	id: ServiceProductId;
	label: string;
	needsPlan: boolean;
	needsDomain: boolean;
	needsProvisionUser: boolean;
	supportsZeepoTokens: boolean;
	defaultBillingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | "ONE_TIME";
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
		needsDomain: true,
		needsProvisionUser: true,
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
	{
		id: "one_time_service",
		label: "One-time service",
		needsPlan: false,
		needsDomain: false,
		needsProvisionUser: false,
		supportsZeepoTokens: false,
		defaultBillingCycle: "ONE_TIME",
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
	// Strip port (example.com:443) but not IPv6  we reject IPs separately.
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
		teamId: z.string().min(1, "Select an organization"),
		serviceProduct: z.enum(SERVICE_PRODUCT_IDS),
		planId: z.string().optional(),
		serviceName: z.string().optional(),
		customPrice: z.string().optional(),
		billingCycle: z.enum(["MONTHLY", "YEARLY", "BIENNIALLY", "CUSTOM", "ONE_TIME"]).optional(),
		provisionUserId: z.string().optional(),
		primaryDomain: z.string().optional(),
		portfolioDomainId: z.string().optional(),
		amount: z.string().min(1, "Enter the payment amount"),
		createInvoice: z.boolean().default(false),
		overrideTokens: z.boolean(),
		tokenGrant: z.string().optional(),
	transactionReference: z
		.string()
		.optional()
		.default(""),
	/** How the customer paid  stored on payment_transaction.gateway. */
	gateway: z.enum(["MPESA", "JENGA", "OTHER"]),
	useStkPush: z.boolean().default(false),
	mpesaPhoneNumber: z.string().optional(),
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
		}

		// Validate transaction reference only for manual payments
		if (!data.useStkPush || data.gateway !== "MPESA") {
			const ref = (data.transactionReference ?? "").trim();
			if (ref.length < 3) {
				ctx.addIssue({
					code: "custom",
					message: "Transaction reference must be at least 3 characters",
					path: ["transactionReference"],
				});
			}
			if (ref.length > 120) {
				ctx.addIssue({
					code: "custom",
					message: "Transaction reference is too long",
					path: ["transactionReference"],
				});
			}
		}

		if (def.needsPlan && !data.planId?.trim()) {
			ctx.addIssue({ code: "custom", message: "Select a plan", path: ["planId"] });
		}

		if (data.serviceProduct === "one_time_service") {
			if (!data.serviceName?.trim()) {
				ctx.addIssue({
					code: "custom",
					message: "Enter a service name",
					path: ["serviceName"],
				});
			}
			const price = Number.parseFloat(data.customPrice ?? "");
			if (!Number.isFinite(price) || price <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "Enter a price greater than 0",
					path: ["customPrice"],
				});
			}
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

	if (data.useStkPush && data.gateway === "MPESA") {
		const phone = (data.mpesaPhoneNumber ?? "").trim();
		if (!phone) {
			ctx.addIssue({
				code: "custom",
				message: "Enter customer's M-Pesa phone number",
				path: ["mpesaPhoneNumber"],
			});
		} else {
			const digits = phone.replace(/\D/g, "");
			if (digits.length < 10) {
				ctx.addIssue({
					code: "custom",
					message: "Phone number must be at least 10 digits",
					path: ["mpesaPhoneNumber"],
				});
			}
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
			serviceName: "",
			customPrice: "",
			billingCycle: "MONTHLY",
			provisionUserId: "",
			primaryDomain: "",
			portfolioDomainId: "",
			amount: "",
			createInvoice: false,
			overrideTokens: false,
			tokenGrant: "",
			transactionReference: "",
			gateway: "MPESA",
			useStkPush: false,
			mpesaPhoneNumber: "",
		},
	});

	const watchedTeamId = form.watch("teamId");
	const watchedPlanId = form.watch("planId");
	const watchedBillingCycle = form.watch("billingCycle");
	const watchedOverride = form.watch("overrideTokens");
	const watchedServiceProduct = form.watch("serviceProduct");
	const watchedServiceName = form.watch("serviceName");
	const watchedCustomPrice = form.watch("customPrice");
	const watchedProvisionUserId = form.watch("provisionUserId");
	const watchedPrimaryDomain = form.watch("primaryDomain");
	const watchedPortfolioDomainId = form.watch("portfolioDomainId");
	const watchedAmount = form.watch("amount");
	const watchedCreateInvoice = form.watch("createInvoice");
	const watchedTransactionReference = form.watch("transactionReference");
	const watchedGateway = form.watch("gateway");
	const watchedUseStkPush = form.watch("useStkPush");
	const watchedMpesaPhoneNumber = form.watch("mpesaPhoneNumber");

	// STK Push state
	const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
	const [paymentError, setPaymentError] = React.useState<string | null>(null);
	const [isAwaitingPayment, setIsAwaitingPayment] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);

	// STK Push polling refs (instant polling pattern like storefront)
	const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
	const pollingQuickRetryRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const terminalStateDetectedRef = React.useRef(false);
	const pollAttemptsRef = React.useRef(0);
	const pendingStkCreateRef = React.useRef<{
		productId: string;
		billedForUserId: string;
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

	const serviceDef = getServiceDef(watchedServiceProduct);

	const { data: teamMembers = [] } = trpc.teams.getMembers.useQuery(
		{ teamId: watchedTeamId },
		{ enabled: open && Boolean(watchedTeamId) },
	);

	// Get all domains from OpenProvider and KENIC (like the domains portfolio page)
	const { data: opDomainsData, isLoading: loadingOpDomains } = trpc.openProvider.domains.list.useQuery(
		{ limit: 1000, offset: 0, with_customer_info: false },
		{ enabled: open, refetchOnWindowFocus: false },
	);

	const { data: kenicDomainsData, isLoading: loadingKenicDomains } = trpc.kenic.domainList.list.useQuery(
		{},
		{ enabled: open, refetchOnWindowFocus: false },
	);

	const loadingDomains = loadingOpDomains || loadingKenicDomains;

	// Combine and normalize domains from both sources
	const allDomains = React.useMemo(() => {
		const normalize = (name: string) => name.trim().toLowerCase().replace(/\.$/, "");
		
		const kenicDomains = (kenicDomainsData?.data ?? []).map((d: any) => ({
			id: String(d.id),
			domainName: d.domain,
			source: "kenic" as const,
		}));

		const kenicNames = new Set(kenicDomains.map((d) => normalize(d.domainName)));

		const opDomains = (opDomainsData?.data ?? [])
			.filter((d: any) => {
				const name = normalize(d.domain);
				// Skip .ke domains from OP if they're in KENIC
				if (name.endsWith(".ke") && kenicNames.has(name)) return false;
				return true;
			})
			.map((d: any) => ({
				id: String(d.id),
				domainName: d.domain,
				source: "openprovider" as const,
			}));

		return [...opDomains, ...kenicDomains];
	}, [opDomainsData?.data, kenicDomainsData?.data]);

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
	const isOneTime = watchedServiceProduct === "one_time_service";

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

	const { data: oneTimeProductId } = trpc.clientSubscriptions.getOneTimeServicesProductId.useQuery(
		undefined,
		{ enabled: open },
	);

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

	const domainItems = React.useMemo((): ComboboxItem[] => {
		return allDomains.map((d) => ({
			id: d.id,
			label: d.domainName,
		}));
	}, [allDomains]);

	React.useEffect(() => {
		if (!open) {
			form.reset();
			// Reset STK push state when dialog closes
			stopPolling();
			terminalStateDetectedRef.current = false;
			pollAttemptsRef.current = 0;
			setCheckoutRequestId(null);
			setPaymentError(null);
			setIsAwaitingPayment(false);
			setSubmitting(false);
		}
	}, [open, form, stopPolling]);

	React.useEffect(() => {
		form.setValue("planId", "");
		form.setValue("billingCycle", getServiceDef(watchedServiceProduct).defaultBillingCycle);
		form.setValue("amount", "");
		form.setValue("serviceName", "");
		form.setValue("customPrice", "");
		form.setValue("overrideTokens", false);
		form.setValue("tokenGrant", "");
		form.setValue("primaryDomain", "");
		form.setValue("portfolioDomainId", "");
	}, [watchedServiceProduct, form]);

	React.useEffect(() => {
		if (!selectedPlan) return;
		
		// Set billing cycle from plan
		const cycle = selectedPlan.zeepoPlanType === "top_up" 
			? "CUSTOM" 
			: normalizeBillingCycle(selectedPlan.billingCycle);
		form.setValue("billingCycle", cycle);
		
		if (isZeepo && selectedPlan.tokenGrant != null && !form.getValues("overrideTokens")) {
			form.setValue("tokenGrant", String(selectedPlan.tokenGrant));
		}
	}, [selectedPlan, isZeepo, form]);

	// Recalculate amount when billing cycle changes
	const calculateAmountForBillingCycle = React.useCallback((
		basePlanPrice: number,
		billingCycle: string,
	): number => {
		// Get the base cycle from the plan
		const planCycle = selectedPlan?.billingCycle?.toUpperCase() || "MONTHLY";
		const selectedCycle = billingCycle?.toUpperCase() || "MONTHLY";
		
		// Define multipliers
		const cycleMonths: Record<string, number> = {
			MONTHLY: 1,
			YEARLY: 12,
			BIENNIALLY: 24,
			CUSTOM: 1,
		};
		
		const planMonths = cycleMonths[planCycle] || 1;
		const selectedMonths = cycleMonths[selectedCycle] || 1;
		
		// Calculate: (basePlanPrice / planMonths) * selectedMonths
		const monthlyRate = basePlanPrice / planMonths;
		const subtotal = monthlyRate * selectedMonths;
		// Add 16% tax
		return subtotal * 1.16;
	}, [selectedPlan]);

	const calculateAmountBreakdown = React.useCallback((
		basePlanPrice: number,
		billingCycle: string,
	): { subtotal: number; tax: number; total: number } => {
		// Get the base cycle from the plan
		const planCycle = selectedPlan?.billingCycle?.toUpperCase() || "MONTHLY";
		const selectedCycle = billingCycle?.toUpperCase() || "MONTHLY";
		
		// Define multipliers
		const cycleMonths: Record<string, number> = {
			MONTHLY: 1,
			YEARLY: 12,
			BIENNIALLY: 24,
			CUSTOM: 1,
		};
		
		const planMonths = cycleMonths[planCycle] || 1;
		const selectedMonths = cycleMonths[selectedCycle] || 1;
		
		// Calculate: (basePlanPrice / planMonths) * selectedMonths
		const monthlyRate = basePlanPrice / planMonths;
		const subtotal = monthlyRate * selectedMonths;
		const tax = subtotal * 0.16; // 16% tax
		const total = subtotal + tax;
		
		return { subtotal, tax, total };
	}, [selectedPlan]);

	React.useEffect(() => {
		if (!selectedPlan || !watchedBillingCycle) return;
		
		const calculatedAmount = calculateAmountForBillingCycle(
			selectedPlan.displayPrice,
			watchedBillingCycle,
		);
		
		form.setValue("amount", String(Math.ceil(calculatedAmount)));
	}, [selectedPlan, watchedBillingCycle, calculateAmountForBillingCycle, form]);

	React.useEffect(() => {
		if (!isOneTime) return;
		const exVat = Number.parseFloat(watchedCustomPrice ?? "");
		if (!Number.isFinite(exVat) || exVat <= 0) {
			form.setValue("amount", "");
			return;
		}
		form.setValue("amount", String(Math.ceil(exVat * 1.16)));
	}, [isOneTime, watchedCustomPrice, form]);

	const recordManualPayment = trpc.paymentTransactions.recordManual.useMutation();
	const createFromPayment = trpc.niscServiceOrders.createFromPayment.useMutation();

	const buildOrderPricing = React.useCallback(
		(data: CreateFormData) => {
			const def = getServiceDef(data.serviceProduct);
			const amount = Math.ceil(Number.parseFloat(data.amount));
			if (def.id === "one_time_service") {
				const actualPlanPriceExVat = Math.ceil(Number.parseFloat(data.customPrice ?? "0"));
				const actualPlanPrice = Math.ceil(actualPlanPriceExVat * 1.16);
				const description = data.serviceName?.trim() || def.label;
				return {
					billingCycle: "ONE_TIME" as const,
					actualPlanPrice,
					actualPlanPriceExVat,
					description,
					amount,
					metadata: {
						billingCycle: "ONE_TIME",
						actualPlanPrice: String(actualPlanPrice),
						actualPlanPriceExVat: String(actualPlanPriceExVat),
						amountPaid: String(amount),
						isPartialPayment: amount < actualPlanPrice,
						subscriptionName: description,
					} satisfies Record<string, unknown>,
				};
			}

			let billingCycle = data.billingCycle || def.defaultBillingCycle || "MONTHLY";
			if (selectedPlan && !data.billingCycle) {
				billingCycle =
					selectedPlan.zeepoPlanType === "top_up"
						? "CUSTOM"
						: normalizeBillingCycle(selectedPlan.billingCycle);
			}
			const actualPlanPrice = selectedPlan
				? calculateAmountForBillingCycle(selectedPlan.displayPrice, billingCycle || "MONTHLY")
				: amount;
			const actualPlanPriceExVat = Math.ceil(actualPlanPrice / 1.16);
			return {
				billingCycle,
				actualPlanPrice,
				actualPlanPriceExVat,
				description: selectedPlan?.name ?? def.label,
				amount,
				metadata: {
					billingCycle,
					actualPlanPrice: String(Math.ceil(actualPlanPrice)),
					actualPlanPriceExVat: String(actualPlanPriceExVat),
					amountPaid: String(amount),
					isPartialPayment: amount < Math.ceil(actualPlanPrice),
				} satisfies Record<string, unknown>,
			};
		},
		[selectedPlan, calculateAmountForBillingCycle],
	);

	const resolveProductId = React.useCallback((): string | null => {
		if (isOneTime) return oneTimeProductId ? String(oneTimeProductId) : null;
		if (isZeepo) return zeepoPlansData?.productId ? String(zeepoPlansData.productId) : null;
		return selectedPlan?.productId ?? null;
	}, [isOneTime, oneTimeProductId, isZeepo, zeepoPlansData?.productId, selectedPlan?.productId]);

	const resolveCustomerBilledForUserId = React.useCallback(
		(provisionUserId?: string) => {
			return (
				provisionUserId?.trim() ||
				defaultOwnerUserId ||
				teamMembers.find((m) => m.role === "OWNER")?.userId ||
				teamMembers[0]?.userId ||
				""
			);
		},
		[defaultOwnerUserId, teamMembers],
	);

	const proceedWithSubscriptionCreation = React.useCallback(async (successCheckoutRequestId: string) => {
		setIsAwaitingPayment(false);
		try {
			const data = form.getValues();
			const def = getServiceDef(data.serviceProduct);
			const pending = pendingStkCreateRef.current;
			const billedForUserId =
				pending?.billedForUserId || resolveCustomerBilledForUserId(data.provisionUserId);

			const productId = pending?.productId || resolveProductId();
			if (!productId) {
				toast.error("Product is not available.");
				setIsAwaitingPayment(false);
				return;
			}
			if (!billedForUserId) {
				toast.error("Select a customer organization with at least one member.");
				setIsAwaitingPayment(false);
				return;
			}

			const currency = selectedPlan?.displayCurrency || "KES";
			
			let primaryDomain: string | undefined;
			if (def.needsDomain) {
				const domainResult = validateDomainName(data.primaryDomain ?? "");
				if (!domainResult.ok) {
					toast.error(domainResult.message);
					setIsAwaitingPayment(false);
					return;
				}
				primaryDomain = domainResult.normalized;
			}

			const pricing = buildOrderPricing(data);
			const metadata: Record<string, unknown> = { ...pricing.metadata };

			if (def.supportsZeepoTokens && data.overrideTokens && data.tokenGrant?.trim()) {
				metadata[ZEEPO_TOKEN_OVERRIDE_KEY] = Number.parseInt(data.tokenGrant, 10);
			}

			if (def.needsProvisionUser) {
				metadata.provisionUserId = billedForUserId;
			}

			await createFromPayment.mutateAsync({
				checkoutRequestId: successCheckoutRequestId,
				teamId: data.teamId,
				billedForUserId,
				currency,
				skipInvoice: !data.createInvoice,
				items: [
					{
						productId,
						productPlanId: def.needsPlan ? data.planId || undefined : undefined,
						billingCycle: pricing.billingCycle,
						itemPrice: String(pricing.actualPlanPriceExVat),
						itemSubtotal: String(pricing.actualPlanPriceExVat),
						description: pricing.description,
						...(primaryDomain ? { primaryDomain } : {}),
						metadata,
					},
				],
			});

			toast.success("Subscription created and provisioned for the customer.");
			captureEvent("subscription_created");
			setIsAwaitingPayment(false);
			setCheckoutRequestId(null);
			pendingStkCreateRef.current = null;
			onOpenChange(false);
			void utils.clientSubscriptions.listForAgency.invalidate();
			void utils.niscServiceOrders.getAll.invalidate();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not create subscription.";
			toast.error(message);
			setIsAwaitingPayment(false);
		} finally {
			setSubmitting(false);
		}
	}, [form, resolveCustomerBilledForUserId, resolveProductId, selectedPlan, createFromPayment, utils, onOpenChange, buildOrderPricing]);

	const handlePaymentFailure = React.useCallback((msg: string) => {
		stopPolling();
		terminalStateDetectedRef.current = true;
		pendingStkCreateRef.current = null;
		setPaymentError(msg);
		setIsAwaitingPayment(false);
		setSubmitting(false);
		toast.error(msg);
	}, [stopPolling]);

	const handlePaymentSuccess = React.useCallback(async (checkoutRequestId: string) => {
		stopPolling();
		terminalStateDetectedRef.current = true;
		setPaymentError(null);
		try {
			await proceedWithSubscriptionCreation(checkoutRequestId);
			// Success toast is already shown in proceedWithSubscriptionCreation
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to create subscription.";
			setIsAwaitingPayment(false);
			setPaymentError(msg);
			toast.error(msg);
		}
	}, [stopPolling, proceedWithSubscriptionCreation]);

	const startPolling = React.useCallback((checkoutRequestId: string) => {
		stopPolling();
		terminalStateDetectedRef.current = false;
		pollAttemptsRef.current = 0;
		setIsAwaitingPayment(true);
		setPaymentError(null);

		const poll = async (): Promise<boolean> => {
			if (terminalStateDetectedRef.current) return true;

			try {
				const res = await utils.client.paymentGateway.mpesa.queryStkPush.query({
					checkoutRequestId,
				});
				
				const resultCode = res.data?.resultCode ? Number.parseInt(res.data.resultCode, 10) : null;
				const resultDesc = res.data?.resultDesc;

				if (resultCode === null) return false;
				
				// M-Pesa processing codes (1037, 4999) - keep polling
				if (resultCode === 1037 || resultCode === 4999) return false;

				if (resultCode === 0) {
					void handlePaymentSuccess(checkoutRequestId);
					return true;
				}

				// All other codes are terminal failures
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
			}
		};

		// Immediate first poll
		poll().then((finished) => {
			if (finished) return;

			pollAttemptsRef.current = 1;
			// Quick 1-second retry
			pollingQuickRetryRef.current = setTimeout(async () => {
				pollingQuickRetryRef.current = null;
				if (terminalStateDetectedRef.current) return;

				pollAttemptsRef.current += 1;
				const done = await poll();
				if (done) return;

				// Regular polling every 1 second (MPESA_POLL_INTERVAL_MS = 1000)
				const id = setInterval(async () => {
					if (terminalStateDetectedRef.current) return;

					pollAttemptsRef.current += 1;
					const finishedAgain = await poll();
					if (finishedAgain || pollAttemptsRef.current >= 90) {
						stopPolling();
						if (!finishedAgain && pollAttemptsRef.current >= 90) {
							handlePaymentFailure(
								"Payment is taking longer than expected. Please check M-Pesa or try again.",
							);
						}
					}
				}, 1000);
				pollingIntervalRef.current = id;
			}, 1000);
		});
	}, [stopPolling, handlePaymentFailure, handlePaymentSuccess, utils]);

	// STK Push mutations
	const initiateMpesaPayment = trpc.paymentGateway.mpesa.initiateStkPush.useMutation({
		onError: (error) => {
			toast.error(error.message || "Failed to initiate M-Pesa payment");
			pendingStkCreateRef.current = null;
			setIsAwaitingPayment(false);
			setSubmitting(false);
			setPaymentError(error.message);
		},
	});

	// M-Pesa error helper (matching storefront)
	function getMpesaUserFriendlyError(resultCode: number, resultDesc?: string): string {
		const map: Record<number, string> = {
			0: "Payment completed successfully",
			1: "Insufficient balance in M-Pesa account",
			2: "Amount is below the minimum transaction limit",
			3: "Amount exceeds the maximum transaction limit",
			4: "Transaction would exceed daily transfer limit",
			8: "Transaction would exceed account balance limit",
			17: "Too many requests. Please wait a few minutes and try again",
			1019: "Payment request expired. Please initiate a new payment",
			1025: "Error sending payment request. Please try again",
			1032: "Payment request was cancelled",
			2001: "Incorrect M-Pesa PIN entered. Please try again with the correct PIN",
			2028: "Payment request not permitted. Please contact support",
			8006: "M-Pesa account is locked. Please contact M-Pesa customer care",
		};
		return map[resultCode] ?? resultDesc ?? `Payment failed with error code ${resultCode}`;
	}

	const onSubmit = form.handleSubmit(
		async (data) => {
			const def = getServiceDef(data.serviceProduct);
			const billedForUserId = resolveCustomerBilledForUserId(data.provisionUserId);

			const productId = resolveProductId();
			if (!productId) {
				toast.error("Product is not available. Check that it is seeded and active.");
				return;
			}

			if (!billedForUserId) {
				toast.error("Select a customer organization with at least one member.");
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

			if (def.needsProvisionUser && !data.provisionUserId?.trim()) {
				toast.error("Select the provisioning identity user.");
				form.setError("provisionUserId", {
					message: "Select the user whose profile will be used for provisioning",
				});
				return;
			}

			// Handle STK Push flow
			if (data.useStkPush && data.gateway === "MPESA") {
				setIsAwaitingPayment(true);
				setSubmitting(true);
				try {
					const phoneNumber = data.mpesaPhoneNumber?.trim() || "";
					pendingStkCreateRef.current = { productId, billedForUserId };
				const response = await initiateMpesaPayment.mutateAsync({
					phoneNumber,
					amount,
					accountReference: `SUB${Date.now().toString().slice(-8)}`, // Alphanumeric only, max 12 chars
					transactionDesc: def.label.slice(0, 13),
					checkoutTotalIncVat: amount,
					teamId: data.teamId,
					billedForUserId,
				});
					const checkoutId = response.data?.checkoutRequestId;
					if (!checkoutId) {
						pendingStkCreateRef.current = null;
						toast.error("Payment request sent but failed to get transaction ID.");
						setIsAwaitingPayment(false);
						setSubmitting(false);
						return;
					}
					setCheckoutRequestId(checkoutId);
					setPaymentError(null);
					toast.message("Check customer's phone for the M-Pesa prompt.");
					startPolling(checkoutId);
				} catch (error) {
					// Error handled by mutation onError
					pendingStkCreateRef.current = null;
					setSubmitting(false);
				}
				return;
			}

		// Handle manual payment flow (existing logic)
		setSubmitting(true);
		try {
			const pricing = buildOrderPricing(data);
			const productLabel = def.id === "one_time_service" ? pricing.description : def.label;
			const planLabel = selectedPlan?.name ?? primaryDomain ?? "order";

			const payment = await recordManualPayment.mutateAsync({
				transactionReference: (data.transactionReference || "MANUAL").trim(),
				amount,
				currency,
				gateway: data.gateway,
				teamId: data.teamId,
				transactionDesc: `Agency subscription: ${productLabel} - ${planLabel}`.slice(0, 200),
				billedForUserId,
			});

		const metadata: Record<string, unknown> = { ...pricing.metadata };

		if (def.supportsZeepoTokens && data.overrideTokens && data.tokenGrant?.trim()) {
			metadata[ZEEPO_TOKEN_OVERRIDE_KEY] = Number.parseInt(data.tokenGrant, 10);
		}

		if (def.needsProvisionUser) {
			metadata.provisionUserId = billedForUserId;
		}

		await createFromPayment.mutateAsync({
			checkoutRequestId: payment.checkoutRequestId,
			teamId: data.teamId,
			billedForUserId,
			currency,
			/** Agency manual provision - skip invoice unless checkbox enabled */
			skipInvoice: !data.createInvoice,
			items: [
				{
					productId,
					productPlanId: def.needsPlan ? data.planId : undefined,
					billingCycle: pricing.billingCycle,
					itemPrice: String(pricing.actualPlanPriceExVat),
					itemSubtotal: String(pricing.actualPlanPriceExVat),
					description: pricing.description,
					...(primaryDomain ? { primaryDomain } : {}),
					metadata,
				},
			],
		});

			toast.success("Subscription created and provisioned for the customer.");
			captureEvent("subscription_created");
			onOpenChange(false);
			void utils.clientSubscriptions.listForAgency.invalidate();
			void utils.niscServiceOrders.getAll.invalidate();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not create subscription.";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	},
	// Handle validation errors
	(errors) => {
		console.error("Form validation errors:", errors);
		const firstError = Object.values(errors)[0];
		if (firstError?.message) {
			toast.error(firstError.message as string);
		} else {
			toast.error("Please fill in all required fields correctly");
		}
	});

	const isBusy = submitting || recordManualPayment.isPending || createFromPayment.isPending || initiateMpesaPayment.isPending;

	const canSubmit = React.useMemo(() => {
		if (!watchedTeamId) return false;
		if (isOneTime) {
			if (!oneTimeProductId) return false;
			if (!(watchedServiceName ?? "").trim()) return false;
			const price = Number.parseFloat(watchedCustomPrice ?? "");
			if (!Number.isFinite(price) || price <= 0) return false;
		} else if (planOptions.length === 0 || !watchedPlanId) {
			return false;
		}
		const amount = Number.parseFloat(watchedAmount);
		if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) return false;
		
		// For STK push, check phone number instead of transaction reference
		if (watchedUseStkPush && watchedGateway === "MPESA") {
			const phone = (watchedMpesaPhoneNumber ?? "").trim();
			if (!phone || phone.replace(/\D/g, "").length < 10) return false;
		} else {
			// For manual payment, check transaction reference
			if ((watchedTransactionReference?.trim().length ?? 0) < 3) return false;
		}
		
		if (serviceDef.needsProvisionUser && !watchedProvisionUserId?.trim()) return false;
		if (!(watchedProvisionUserId?.trim() || defaultOwnerUserId)) return false;
		if (serviceDef.needsDomain && !isValidDomainName(watchedPrimaryDomain ?? "")) return false;
		return true;
	}, [
		watchedTeamId,
		isOneTime,
		oneTimeProductId,
		watchedServiceName,
		watchedCustomPrice,
		planOptions.length,
		watchedPlanId,
		watchedAmount,
		watchedTransactionReference,
		watchedUseStkPush,
		watchedGateway,
		watchedMpesaPhoneNumber,
		serviceDef.needsProvisionUser,
		serviceDef.needsDomain,
		watchedProvisionUserId,
		defaultOwnerUserId,
		watchedPrimaryDomain,
	]);

	const selectedProvisionUser = provisionUserItems.find((i) => i.id === watchedProvisionUserId);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-2xl p-0 gap-0">
				<SheetHeader className="px-6 pt-6 pb-2">
					<SheetTitle>Create subscription</SheetTitle>
					<SheetDescription>
						Provision a service on behalf of a customer organization. Payment is recorded for your
						records only  no invoice or customer order emails are sent.
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
												<FormLabel>Organization</FormLabel>
												{loadingTeams ? (
													<Skeleton className="h-10 w-full" />
												) : (
													<ComboboxDropdown
														items={teamItems}
														selectedItem={teamItems.find((i) => i.id === field.value)}
														onSelect={(item) => field.onChange(item.id)}
														placeholder="Select organization"
														searchPlaceholder="Search organizations..."
														emptyResults="No organizations found"
														disabled={isBusy}
													/>
												)}
												<FormDescription>
													Subscription is linked to this customer organization.
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
															emptyResults="No organization members found"
															disabled={isBusy}
														/>
													)}
													<FormDescription>
														Defaults to the organization owner. Profile details from this user are
														used when creating the third-party account
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

									{isOneTime ? (
										<>
											<FormField
												control={form.control}
												name="serviceName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Service name</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. Website design"
																{...field}
																disabled={isBusy}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="customPrice"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Price ({displayCurrency})</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={1}
																step={1}
																inputMode="decimal"
																placeholder="0"
																{...field}
																disabled={isBusy}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
									) : null}

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
																				{plan.name} —{" "}
																				{(plan.tokenGrant ?? 0).toLocaleString()} tokens (
																				{plan.zeepoPlanType === "top_up"
																					? "top-up"
																					: "subscription"}
																				)
																			</>
																		) : (
																			<>
																				{plan.name} — {plan.displayCurrency}{" "}
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

									{/* Billing Cycle Selector */}
									{serviceDef.needsPlan && selectedPlan ? (
										<FormField
											control={form.control}
											name="billingCycle"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Billing Cycle</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
														disabled={isBusy}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select billing cycle" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="MONTHLY">Monthly</SelectItem>
															<SelectItem value="YEARLY">Yearly</SelectItem>
															<SelectItem value="BIENNIALLY">Biennially</SelectItem>
															<SelectItem value="CUSTOM">Custom</SelectItem>
														</SelectContent>
													</Select>
													<FormDescription>
														Auto-filled from plan; editable for custom billing arrangements.
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									) : null}

									{serviceDef.needsDomain ? (
										<>
											{/* Portfolio Domain Selector */}
											<FormField
												control={form.control}
												name="portfolioDomainId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Select from Portfolio (Optional)</FormLabel>
														{loadingDomains ? (
															<Skeleton className="h-10 w-full" />
														) : (
															<ComboboxDropdown
																items={domainItems}
																selectedItem={domainItems.find((i) => i.id === field.value)}
																onSelect={(item) => {
																	field.onChange(item.id);
																	// Auto-fill primaryDomain with selected domain name
																	const selectedDomain = allDomains.find((d) => d.id === item.id);
																	if (selectedDomain) {
																		form.setValue("primaryDomain", selectedDomain.domainName);
																	}
																}}
																placeholder="Select domain from portfolio"
																searchPlaceholder="Search domains..."
																emptyResults="No domains found in portfolio"
																disabled={isBusy}
															/>
														)}
														<FormDescription>
															Choose an existing domain from your portfolio, or enter a new domain below.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											{/* Manual Domain Input */}
											<FormField
												control={form.control}
												name="primaryDomain"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Domain Name</FormLabel>
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
														Valid FQDN only (e.g. example.com). Used as the webspace name.
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										</>
									) : null}
								</section>

								<section className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<Receipt className="h-4 w-4" />
										Payment
									</h3>

								{/* Expected Amount Display */}
								{isOneTime && Number.parseFloat(watchedCustomPrice ?? "") > 0 ? (
									<div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
										<div className="space-y-1.5">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Subtotal:</span>
												<span className="font-medium">
													{displayCurrency}{" "}
													{Math.ceil(Number.parseFloat(watchedCustomPrice ?? "0")).toLocaleString()}
												</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Tax (16%):</span>
												<span className="font-medium">
													{displayCurrency}{" "}
													{Math.ceil(
														Number.parseFloat(watchedCustomPrice ?? "0") * 0.16,
													).toLocaleString()}
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between pt-2 border-t">
											<span className="text-sm font-medium text-muted-foreground">Expected Amount:</span>
											<span className="text-2xl font-bold text-primary">
												{displayCurrency}{" "}
												{Math.ceil(Number.parseFloat(watchedCustomPrice ?? "0") * 1.16).toLocaleString()}
											</span>
										</div>
										<div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
											<span>{watchedServiceName?.trim() || "One-time service"}</span>
											<span>One-time</span>
										</div>
									</div>
								) : selectedPlan ? (
									<div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
										<div className="space-y-1.5">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Subtotal:</span>
												<span className="font-medium">
													{displayCurrency} {Math.ceil(
														calculateAmountBreakdown(
															selectedPlan.displayPrice,
															watchedBillingCycle || "MONTHLY"
														).subtotal
													).toLocaleString()}
												</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">Tax (16%):</span>
												<span className="font-medium">
													{displayCurrency} {Math.ceil(
														calculateAmountBreakdown(
															selectedPlan.displayPrice,
															watchedBillingCycle || "MONTHLY"
														).tax
													).toLocaleString()}
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between pt-2 border-t">
											<span className="text-sm font-medium text-muted-foreground">Expected Amount:</span>
											<span className="text-2xl font-bold text-primary">
												{displayCurrency} {Math.ceil(
													calculateAmountBreakdown(
														selectedPlan.displayPrice,
														watchedBillingCycle || "MONTHLY"
													).total
												).toLocaleString()}
											</span>
										</div>
										<div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
											<span>
												{selectedPlan.name}
												{isZeepo && selectedPlan.tokenGrant != null && (
													<> ({(selectedPlan.tokenGrant ?? 0).toLocaleString()} tokens)</>
												)}
											</span>
											<span className="capitalize">
												{isZeepo && selectedPlan.zeepoPlanType === "top_up" 
													? "One-time top-up"
													: `Billed ${watchedBillingCycle?.toLowerCase() || selectedPlan.billingCycle.toLowerCase()}`}
											</span>
										</div>
									</div>
								) : (
									<div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
										{isOneTime
											? "Enter a price to see tax and total"
											: "Select a plan above to see the expected payment amount"}
									</div>
								)}

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
												{isOneTime ? (
													<>
														Auto-filled from price ({displayCurrency}{" "}
														{Math.ceil(
															(Number.parseFloat(watchedCustomPrice ?? "0") || 0) * 1.16,
														).toLocaleString()}{" "}
														including 16% tax). Any amount accepted – partial payments are tracked on the invoice.
													</>
												) : selectedPlan ? (
													<>
														Auto-filled from selected plan ({displayCurrency}{" "}
														{Math.ceil(
															calculateAmountForBillingCycle(
																selectedPlan.displayPrice,
																watchedBillingCycle || "MONTHLY"
															)
														).toLocaleString()} /{" "}
														{(watchedBillingCycle || selectedPlan.billingCycle).toLowerCase()}, including 16% tax). Any amount accepted – partial payments are tracked on the invoice.
													</>
												) : (
													<>
														Any amount in {displayCurrency}. Select a plan to auto-fill. Partial payments are supported.
													</>
												)}
											</FormDescription>
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
												<Select
													onValueChange={field.onChange}
													value={field.value}
													disabled={isBusy}
												>
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
												<FormDescription>
													Stored on the payment transaction for invoices and reporting.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									
									{/* STK Push Checkbox - Only visible for M-Pesa */}
									{watchedGateway === "MPESA" && (
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
															<FormDescription>
																Automatically send payment prompt to customer's phone and wait for payment before provisioning.
															</FormDescription>
														</div>
													</FormItem>
												)}
											/>

											{/* M-Pesa Phone Number - Only visible when STK push is enabled */}
											{watchedUseStkPush && (
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
																	disabled={isBusy || isAwaitingPayment}
																/>
															</FormControl>
															<FormDescription>
																Enter the customer's Safaricom M-Pesa number to send the payment prompt.
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
										</>
									)}
									
									{/* Transaction Reference - Hidden when using STK push */}
									{(!watchedUseStkPush || watchedGateway !== "MPESA") && (
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
									)}
									
									{/* Create Invoice Checkbox */}
									<FormField
										control={form.control}
										name="createInvoice"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
														disabled={isBusy}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Create invoice for this subscription</FormLabel>
													<FormDescription>
														Generate and send an invoice to the customer for this subscription payment.
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>
								</section>
							</div>
						</ScrollArea>

					<SheetFooter className="flex-shrink-0 flex-wrap gap-2 px-6 py-4 border-t bg-muted/30">
						{/* Payment status message */}
						{isAwaitingPayment && (
							<div className="w-full flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
								<Spinner size={16} />
								<span>Waiting for customer to complete M-Pesa payment...</span>
							</div>
						)}
						{paymentError && (
							<div className="w-full rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
								{paymentError}
							</div>
						)}
						
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								if (isAwaitingPayment) {
									stopPolling();
									pendingStkCreateRef.current = null;
									setIsAwaitingPayment(false);
									setCheckoutRequestId(null);
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
									{watchedUseStkPush && watchedGateway === "MPESA" ? "Sending payment prompt…" : "Processing…"}
								</>
							) : isAwaitingPayment ? (
								<>
									<Spinner size={16} className="mr-2" />
									Awaiting payment…
								</>
							) : (
								<>
									<Plus className="mr-2 h-4 w-4" />
									{watchedUseStkPush && watchedGateway === "MPESA" ? "Send payment prompt" : "Create subscription"}
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
