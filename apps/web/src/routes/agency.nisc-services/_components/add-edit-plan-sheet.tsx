"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { XIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { getPricingModelDisplayName, getBillingCycleDisplayName } from "./nisc-services-utils";

// ---------------------------------------------------------------------------
// Types: product features and plan feature toggles
// ---------------------------------------------------------------------------

type ProductFeature = { key: string; label: string; description?: string };
type PlanFeatureInput = { key: string; available: boolean; valueOverride?: string };

const billingCycleSchema = z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]);
const pricingModelSchema = z.enum(["FIXED", "COMMISSION"]);
const planFormSchema = z
    .object({
        name: z.string().min(1, "Plan name is required").max(255),
        description: z.string().optional(),
        pricingModel: pricingModelSchema,
        billingCycle: billingCycleSchema.optional(),
        price: z.string().optional(),
        currency: z.string().default("KES"),
        setupFee: z.string().optional(),
        commissionRate: z.number().positive().optional(),
        commissionBase: z.string().optional(),
        commissionBaseDescription: z.string().optional(),
        planFeatures: z.array(
            z.object({
                key: z.string(),
                available: z.boolean(),
                valueOverride: z.string().optional(),
            }),
        ),
        highlights: z.array(z.object({ value: z.string() })).default([]),
        isPopular: z.boolean().default(false),
        isRecommended: z.boolean().default(false),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
        pleskServicePlanId: z.string().optional(),
        pleskFilterId: z.string().optional(),
        pleskIpAddress: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.pricingModel === "FIXED" && !data.billingCycle) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Billing cycle is required", path: ["billingCycle"] });
        }
        if (data.pricingModel === "COMMISSION") {
            if (data.commissionRate === undefined || data.commissionRate === null) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Commission rate is required", path: ["commissionRate"] });
            }
            if (!data.commissionBase?.trim()) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Commission base is required", path: ["commissionBase"] });
            }
        }
    });

type FormData = z.infer<typeof planFormSchema>;

const BILLING_CYCLES = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "YEARLY", label: "Yearly" },
    { value: "BIENNIALLY", label: "Biennial" },
    { value: "CUSTOM", label: "Custom" },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddEditPlanSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string;
    productName: string;
    productCategory: string;
    productFeatures: ProductFeature[];
    planId?: string | null;
    onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddEditPlanSheet({
    open,
    onOpenChange,
    productId,
    productName,
    productCategory,
    productFeatures,
    planId,
    onSuccess,
}: AddEditPlanSheetProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const isEditing = !!planId;

    const { data: planData, isLoading: isLoadingPlan } = trpc.products.getPlanById.useQuery(
        { id: planId! },
        { enabled: isEditing && !!planId },
    );

    const createPlan = trpc.products.createPlan.useMutation({
        onSuccess: () => {
            toast.success("Plan created");
            onOpenChange(false);
            onSuccess();
        },
        onError: (e) => toast.error(e.message || "Failed to create plan"),
    });

    const updatePlan = trpc.products.updatePlan.useMutation({
        onSuccess: () => {
            toast.success("Plan updated");
            onOpenChange(false);
            onSuccess();
        },
        onError: (e) => toast.error(e.message || "Failed to update plan"),
    });

    const form = useForm<FormData>({
        resolver: zodResolver(planFormSchema),
        defaultValues: {
            name: "",
            description: "",
            pricingModel: "FIXED",
            billingCycle: "MONTHLY",
            price: "",
            currency: "KES",
            setupFee: "",
            commissionRate: undefined,
            commissionBase: "",
            commissionBaseDescription: "",
            planFeatures: productFeatures.map((f) => ({ key: f.key, available: false, valueOverride: undefined })),
            highlights: [],
            isPopular: false,
            isRecommended: false,
            isActive: true,
            isDefault: false,
            sortOrder: 0,
            pleskServicePlanId: "",
            pleskFilterId: "",
            pleskIpAddress: "",
        },
    });

    const pricingModel = form.watch("pricingModel");
    const isCloud = productCategory === "CLOUD";
    const selectedPleskPlanId = form.watch("pleskServicePlanId");

    // Fetch Plesk service plans when product is CLOUD (hosting)
    const { data: pleskServicePlansData, isLoading: isLoadingPleskPlans } =
        trpc.plesk.servicePlans.getAll.useQuery(
            {},
            { enabled: open && isCloud, staleTime: 5 * 60 * 1000 },
        );

    const pleskServicePlans = React.useMemo(() => {
        if (!pleskServicePlansData?.parsed) return [];
        try {
            const parsed = pleskServicePlansData.parsed as { packet?: { "service-plan"?: { get?: { result?: unknown } } } };
            const plans = parsed?.packet?.["service-plan"]?.get?.result;
            if (!plans) return [];
            const planArray = Array.isArray(plans) ? plans : [plans];
            return planArray
                .map((plan: unknown) => {
                    const p = plan as { id?: string | { "#text"?: string }; name?: string | { "#text"?: string }; description?: string | { "#text"?: string } };
                    const id = (typeof p.id === "object" ? p.id?.["#text"] : p.id)?.toString() ?? "";
                    const name = typeof p.name === "object" ? p.name?.["#text"] : p.name ?? "";
                    const description = typeof p.description === "object" ? p.description?.["#text"] : p.description ?? "";
                    return { id, name: String(name), description: String(description) };
                })
                .filter((p: { id: string; name: string }) => p.id && p.name);
        } catch {
            return [];
        }
    }, [pleskServicePlansData]);

    // Auto-populate pleskFilterId when a Plesk service plan is selected
    React.useEffect(() => {
        if (selectedPleskPlanId && isCloud) {
            form.setValue("pleskFilterId", selectedPleskPlanId);
        } else if (!selectedPleskPlanId && isCloud) {
            form.setValue("pleskFilterId", "");
        }
    }, [selectedPleskPlanId, isCloud, form]);

    // Clear Plesk fields when product is not CLOUD
    React.useEffect(() => {
        if (!isCloud) {
            form.setValue("pleskServicePlanId", "");
            form.setValue("pleskFilterId", "");
            form.setValue("pleskIpAddress", "");
        }
    }, [isCloud, form]);

    // When opening in add mode, reset form with current product's features
    React.useEffect(() => {
        if (open && !isEditing) {
            form.reset({
                name: "",
                description: "",
                pricingModel: "FIXED",
                billingCycle: "MONTHLY",
                price: "",
                currency: "KES",
                setupFee: "",
                commissionRate: undefined,
                commissionBase: "",
                commissionBaseDescription: "",
                planFeatures: productFeatures.map((f) => ({ key: f.key, available: false, valueOverride: undefined })),
                highlights: [],
                isPopular: false,
                isRecommended: false,
                isActive: true,
                isDefault: false,
                sortOrder: 0,
                pleskServicePlanId: "",
                pleskFilterId: "",
                pleskIpAddress: "",
            });
        }
    }, [open, isEditing, productFeatures, form]);

    React.useEffect(() => {
        if (planData && isEditing) {
            const raw = planData as {
                name: string;
                description: string | null;
                pricingModel: string;
                billingCycle: string | null;
                price: string | null;
                currency: string | null;
                setupFee: string | null;
                commissionRate: number | null;
                commissionBase: string | null;
                commissionBaseDescription: string | null;
                planFeatures: PlanFeatureInput[];
                highlights: string[];
                isPopular: boolean;
                isRecommended: boolean;
                isActive: boolean;
                isDefault: boolean;
                sortOrder: number;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
            };
            const existingFeatures = Array.isArray(raw.planFeatures) ? raw.planFeatures : [];
            form.reset({
                name: raw.name,
                description: raw.description ?? "",
                pricingModel: raw.pricingModel as "FIXED" | "COMMISSION",
                billingCycle: (raw.billingCycle as FormData["billingCycle"]) ?? "MONTHLY",
                price: raw.price ?? "",
                currency: raw.currency ?? "KES",
                setupFee: raw.setupFee ?? "",
                commissionRate: raw.commissionRate ?? undefined,
                commissionBase: raw.commissionBase ?? "",
                commissionBaseDescription: raw.commissionBaseDescription ?? "",
                planFeatures: productFeatures.map((f) => {
                    const ex = existingFeatures.find((x: PlanFeatureInput) => x.key === f.key);
                    return {
                        key: f.key,
                        available: ex?.available ?? false,
                        valueOverride: ex?.valueOverride ?? "",
                    };
                }),
                highlights: (raw.highlights ?? []).map((h) => ({ value: h })),
                isPopular: raw.isPopular ?? false,
                isRecommended: raw.isRecommended ?? false,
                isActive: raw.isActive ?? true,
                isDefault: raw.isDefault ?? false,
                sortOrder: raw.sortOrder ?? 0,
                pleskServicePlanId: raw.pleskServicePlanId ?? "",
                pleskFilterId: raw.pleskFilterId ?? "",
                pleskIpAddress: raw.pleskIpAddress ?? "",
            });
        }
    }, [planData, isEditing, productFeatures, form]);

    React.useEffect(() => {
        if (!open && !isEditing) {
            form.reset({
                name: "",
                description: "",
                pricingModel: "FIXED",
                billingCycle: "MONTHLY",
                price: "",
                currency: "KES",
                setupFee: "",
                commissionRate: undefined,
                commissionBase: "",
                commissionBaseDescription: "",
                planFeatures: productFeatures.map((f) => ({ key: f.key, available: false, valueOverride: undefined })),
                highlights: [],
                isPopular: false,
                isRecommended: false,
                isActive: true,
                isDefault: false,
                sortOrder: 0,
                pleskServicePlanId: "",
                pleskFilterId: "",
                pleskIpAddress: "",
            });
        }
    }, [open, isEditing, form, productFeatures]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const planFeaturesPayload = data.planFeatures.map((pf) => ({
                key: pf.key,
                available: pf.available,
                ...(pf.valueOverride?.trim() ? { valueOverride: pf.valueOverride.trim() } : {}),
            }));
            const highlightsPayload = data.highlights.map((h) => h.value).filter(Boolean);

            if (isEditing && planId) {
                await updatePlan.mutateAsync({
                    id: planId,
                    productId,
                    name: data.name,
                    description: data.description || undefined,
                    pricingModel: data.pricingModel,
                    billingCycle: data.pricingModel === "FIXED" ? data.billingCycle : undefined,
                    price: data.pricingModel === "FIXED" ? data.price || undefined : undefined,
                    currency: data.currency,
                    setupFee: data.pricingModel === "FIXED" ? data.setupFee || undefined : undefined,
                    commissionRate: data.pricingModel === "COMMISSION" ? data.commissionRate : undefined,
                    commissionBase: data.pricingModel === "COMMISSION" ? data.commissionBase : undefined,
                    commissionBaseDescription:
                        data.pricingModel === "COMMISSION" ? data.commissionBaseDescription : undefined,
                    planFeatures: planFeaturesPayload,
                    highlights: highlightsPayload,
                    isPopular: data.isPopular,
                    isRecommended: data.isRecommended,
                    isActive: data.isActive,
                    isDefault: data.isDefault,
                    sortOrder: data.sortOrder,
                    pleskServicePlanId: isCloud ? data.pleskServicePlanId || undefined : undefined,
                    pleskFilterId: isCloud ? data.pleskFilterId || undefined : undefined,
                    pleskIpAddress: isCloud ? data.pleskIpAddress || undefined : undefined,
                });
            } else {
                await createPlan.mutateAsync({
                    productId,
                    name: data.name,
                    description: data.description || undefined,
                    pricingModel: data.pricingModel,
                    billingCycle: data.pricingModel === "FIXED" ? data.billingCycle : undefined,
                    price: data.pricingModel === "FIXED" ? data.price || undefined : undefined,
                    currency: data.currency,
                    setupFee: data.pricingModel === "FIXED" ? data.setupFee || undefined : undefined,
                    commissionRate: data.pricingModel === "COMMISSION" ? data.commissionRate : undefined,
                    commissionBase: data.pricingModel === "COMMISSION" ? data.commissionBase : undefined,
                    commissionBaseDescription:
                        data.pricingModel === "COMMISSION" ? data.commissionBaseDescription : undefined,
                    planFeatures: planFeaturesPayload,
                    highlights: highlightsPayload,
                    isPopular: data.isPopular,
                    isRecommended: data.isRecommended,
                    isActive: data.isActive,
                    isDefault: data.isDefault,
                    sortOrder: data.sortOrder,
                    pleskServicePlanId: isCloud ? data.pleskServicePlanId || undefined : undefined,
                    pleskFilterId: isCloud ? data.pleskFilterId || undefined : undefined,
                    pleskIpAddress: isCloud ? data.pleskIpAddress || undefined : undefined,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingPlan && isEditing) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="overflow-y-auto">
                    <div className="flex items-center justify-center py-12">
                        <Spinner className="h-8 w-8" />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto max-w-xl">
                <SheetHeader className="mb-4">
                    <SheetTitle>{isEditing ? "Edit Plan" : "Add Plan"}</SheetTitle>
                    <SheetDescription>
                        {productName} — {isEditing ? "Update plan details" : "Create a new pricing plan"}
                    </SheetDescription>
                    <SheetClose asChild>
                        <Button size="icon" variant="ghost" className="absolute right-6 top-6">
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </SheetClose>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Plan name</CardTitle>
                                <CardDescription>e.g. Starter, Pro, Enterprise</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Starter" className="w-full" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Brief description" className="min-h-16 w-full" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Pricing model</CardTitle>
                                <CardDescription>Fixed price per cycle or commission-based</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="pricingModel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FIXED">{getPricingModelDisplayName("FIXED")}</SelectItem>
                                                    <SelectItem value="COMMISSION">{getPricingModelDisplayName("COMMISSION")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {pricingModel === "FIXED" && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="billingCycle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Billing cycle</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select cycle" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {BILLING_CYCLES.map((c) => (
                                                                <SelectItem key={c.value} value={c.value}>
                                                                    {c.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Price</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" placeholder="0" className="w-full" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <FormControl>
                                                            <Input className="w-full" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
<FormField
                                                control={form.control}
                                                name="setupFee"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Setup fee (optional)</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" placeholder="0" className="w-full" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                    </>
                                )}

                                {pricingModel === "COMMISSION" && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="commissionRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Commission rate (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step={0.01}
                                                            placeholder="11"
                                                            className="w-full"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="commissionBase"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Commission base (e.g. ad_spend, gross_revenue)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ad_spend" className="w-full" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="commissionBaseDescription"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description (optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Total monthly ad spend" className="w-full" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {productFeatures.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Feature availability</CardTitle>
                                    <CardDescription>Toggle which product features this plan includes</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {productFeatures.map((f, index) => (
                                        <div key={f.key} className="flex items-center gap-3 rounded-lg border p-3">
                                            <FormField
                                                control={form.control}
                                                name={`planFeatures.${index}.available`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">
                                                            {f.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`planFeatures.${index}.valueOverride`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1 min-w-0">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Override (e.g. 50GB)"
                                                                className="h-8 text-sm w-full"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Options</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="sortOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sort order</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="w-full"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <FormLabel className="font-normal">Active</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isDefault"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <FormLabel className="font-normal">Default plan</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isPopular"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <FormLabel className="font-normal">Popular</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isRecommended"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <FormLabel className="font-normal">Recommended</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {isCloud && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Plesk settings</CardTitle>
                                    <CardDescription>Configure Plesk integration. Select a service plan to auto-fill filter ID.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="pleskServicePlanId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plesk service plan</FormLabel>
                                                {isLoadingPleskPlans ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Spinner className="h-6 w-6" />
                                                        <span className="ml-2 text-sm text-muted-foreground">
                                                            Loading Plesk service plans...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value ?? ""}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select a Plesk service plan" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {pleskServicePlans.length === 0 ? (
                                                                    <SelectItem value="" disabled>
                                                                        No service plans available
                                                                    </SelectItem>
                                                                ) : (
                                                                    pleskServicePlans.map(
                                                                        (plan: { id: string; name: string; description: string }) => (
                                                                            <SelectItem key={plan.id} value={plan.id}>
                                                                                {plan.name}
                                                                                {plan.description ? ` - ${plan.description}` : ""}
                                                                            </SelectItem>
                                                                        ),
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {field.value && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Plan ID: {field.value}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="pleskFilterId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plesk filter ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Auto-populated from service plan"
                                                        className="w-full bg-muted"
                                                        {...field}
                                                        disabled
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Automatically set from the selected service plan
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="pleskIpAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plesk IP address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 192.168.1.1" className="w-full" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        {isEditing ? "Updating..." : "Creating..."}
                                    </>
                                ) : isEditing ? (
                                    "Update Plan"
                                ) : (
                                    "Create Plan"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
