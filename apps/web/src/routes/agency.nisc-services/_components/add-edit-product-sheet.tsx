"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { XIcon, Plus, Trash2, ChevronLeft, ChevronRight, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { getCategoryDisplayName } from "./nisc-services-utils";

// ============================================================================
// Form schema
// ============================================================================

const productFormSchema = z.object({
    name: z.string().min(1, "Product name is required").max(255),
    description: z.string().optional(),
    category: z.enum(["CLOUD", "MARKETING", "CONSULTING", "CUSTOM", "AI"]),
    serviceType: z.string().min(1, "Service type is required").max(100),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    // features: array of { key, label, description }
    features: z.array(
        z.object({
            key: z.string().min(1, "Key is required"),
            label: z.string().min(1, "Label is required"),
            description: z.string().optional(),
        }),
    ).default([]),
    // highlights: simple string array (stored as { value } for react-hook-form)
    highlights: z.array(z.object({ value: z.string().min(1, "Highlight cannot be empty") })).default([]),
    isPopular: z.boolean().default(false),
    isRecommended: z.boolean().default(false),
});

type FormData = z.infer<typeof productFormSchema>;

// ============================================================================
// Step definitions
// ============================================================================

const STEPS = [
    { id: 1, label: "Basics" },
    { id: 2, label: "Features" },
    { id: 3, label: "Options" },
] as const;

// ============================================================================
// Category options
// ============================================================================

const CATEGORIES = [
    { value: "CLOUD", label: "Cloud", description: "Domains, Hosting, WordPress" },
    { value: "MARKETING", label: "Marketing", description: "SEO, Social, Media Buying, Email" },
    { value: "CONSULTING", label: "Consulting", description: "Strategy, advisory, deliverables" },
    { value: "CUSTOM", label: "Custom", description: "Client-defined on-request services" },
    { value: "AI", label: "AI", description: "Image generator, Background remover, etc." },
] as const;

// Suggested service types per category
const SERVICE_TYPE_SUGGESTIONS: Record<string, string[]> = {
    CLOUD: ["web_hosting", "email_hosting", "domain_registration", "wordpress_hosting", "vps_hosting"],
    MARKETING: ["media_buying", "seo", "social_media_management", "email_marketing", "creative_design"],
    CONSULTING: ["strategy_consulting", "digital_transformation", "seo_consulting", "ads_consulting"],
    CUSTOM: ["custom_service"],
    AI: ["ai_image_generator", "background_remover", "ai_tools"],
};

// ============================================================================
// Props
// ============================================================================

interface AddEditProductSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId?: string | null;
    onSuccess?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function AddEditProductSheet({
    open,
    onOpenChange,
    productId,
    onSuccess,
}: AddEditProductSheetProps) {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const isEditing = !!productId;

    // ── Data fetching ───────────────────────────────────────────────────────────

    const { data: productData, isLoading: isLoadingProduct } = trpc.products.getById.useQuery(
        { id: productId!, includePlans: false },
        { enabled: isEditing && !!productId },
    );

    // ── Mutations ───────────────────────────────────────────────────────────────

    const createProduct = trpc.products.create.useMutation({
        onSuccess: () => {
            toast.success("Product created successfully!");
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            toast.error("Failed to create product", { description: err.message });
        },
    });

    const updateProduct = trpc.products.update.useMutation({
        onSuccess: () => {
            toast.success("Product updated successfully!");
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            toast.error("Failed to update product", { description: err.message });
        },
    });

    // ── Form setup ──────────────────────────────────────────────────────────────

    const form = useForm<FormData>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            description: "",
            category: "CLOUD",
            serviceType: "",
            isActive: true,
            sortOrder: 0,
            features: [],
            highlights: [],
            isPopular: false,
            isRecommended: false,
        },
    });

    const {
        fields: featureFields,
        append: appendFeature,
        remove: removeFeature,
    } = useFieldArray({ control: form.control, name: "features" });

    const {
        fields: highlightFields,
        append: appendHighlight,
        remove: removeHighlight,
    } = useFieldArray({ control: form.control, name: "highlights" });

    const selectedCategory = form.watch("category");

    // ── Populate form on edit ───────────────────────────────────────────────────

    React.useEffect(() => {
        if (productData && isEditing) {
            const raw = productData as any;
            form.reset({
                name: raw.name,
                description: raw.description ?? "",
                category: raw.category,
                serviceType: raw.serviceType,
                isActive: raw.isActive,
                sortOrder: raw.sortOrder ?? 0,
                features: Array.isArray(raw.features)
                    ? raw.features.map((f: any) => ({
                        key: f.key ?? "",
                        label: f.label ?? "",
                        description: f.description ?? "",
                    }))
                    : [],
                highlights: Array.isArray(raw.highlights)
                    ? raw.highlights.map((h: string) => ({ value: h }))
                    : [],
                isPopular: raw.isPopular ?? false,
                isRecommended: raw.isRecommended ?? false,
            });
        }
    }, [productData, isEditing, form]);

    // ── Reset when opening in add mode ─────────────────────────────────────────
    // Ensures a fresh form when opening "Add Product" after having edited a product
    const addModeDefaults = React.useMemo(
        () => ({
            name: "",
            description: "",
            category: "CLOUD" as const,
            serviceType: "",
            isActive: true,
            sortOrder: 0,
            features: [] as FormData["features"],
            highlights: [] as FormData["highlights"],
            isPopular: false,
            isRecommended: false,
        }),
        [],
    );

    React.useEffect(() => {
        if (open && !productId) {
            form.reset(addModeDefaults);
            setCurrentStep(1);
        }
    }, [open, productId, form, addModeDefaults]);

    // ── Reset on close ──────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!open) {
            setTimeout(() => {
                form.reset(addModeDefaults);
                setCurrentStep(1);
            }, 300);
        }
    }, [open, form, addModeDefaults]);

    // ── Step navigation ─────────────────────────────────────────────────────────

    const stepFields: Record<number, (keyof FormData)[]> = {
        1: ["name", "description", "category", "serviceType"],
        2: ["features", "highlights"],
        3: ["isActive", "sortOrder", "isPopular", "isRecommended"],
    };

    const goNext = async () => {
        const fields = stepFields[currentStep] as (keyof FormData)[];
        const valid = await form.trigger(fields);
        if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    };

    const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

    // ── Submit ──────────────────────────────────────────────────────────────────

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const features = data.features.map((f) => ({
                key: f.key,
                label: f.label,
                ...(f.description ? { description: f.description } : {}),
            }));
            const highlights = data.highlights.map((h) => h.value).filter(Boolean);

            if (isEditing && productId) {
                await updateProduct.mutateAsync({
                    id: productId,
                    name: data.name,
                    description: data.description || undefined,
                    category: data.category,
                    serviceType: data.serviceType,
                    isActive: data.isActive,
                    sortOrder: data.sortOrder,
                    features,
                    highlights,
                    metadata: {
                        isPopular: data.isPopular,
                        isRecommended: data.isRecommended,
                    },
                });
            } else {
                await createProduct.mutateAsync({
                    name: data.name,
                    description: data.description || undefined,
                    category: data.category,
                    serviceType: data.serviceType,
                    isActive: data.isActive,
                    sortOrder: data.sortOrder,
                    features,
                    highlights,
                    metadata: {
                        isPopular: data.isPopular,
                        isRecommended: data.isRecommended,
                    },
                });
            }
        } catch {
            // errors handled in mutation callbacks
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Loading skeleton inside sheet ────────────────────────────────────────────

    if (isLoadingProduct && isEditing) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="overflow-y-auto">
                    <div className="flex items-center justify-center h-full">
                        <Spinner />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto">
                {/* Header */}
                <SheetHeader className="mb-6 flex justify-between items-center flex-row">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-bold">
                                {isEditing ? "Edit Product" : "Add Product"}
                            </SheetTitle>
                            <SheetDescription className="text-base">
                                {isEditing
                                    ? "Update the product details"
                                    : "Create a new service product for your catalogue"}
                            </SheetDescription>
                        </div>
                    </div>
                    <SheetClose asChild>
                        <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
                            <XIcon className="size-5" />
                        </Button>
                    </SheetClose>
                </SheetHeader>

                {/* Step progress */}
                <div className="mb-6 px-1">
                    <div className="flex items-center gap-0">
                        {STEPS.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Only allow going back to already-completed steps
                                        if (step.id <= currentStep) setCurrentStep(step.id);
                                    }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <div
                                        className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors ${step.id < currentStep
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : step.id === currentStep
                                                    ? "border-primary text-primary"
                                                    : "border-muted-foreground/30 text-muted-foreground"
                                            }`}
                                    >
                                        {step.id < currentStep ? "✓" : step.id}
                                    </div>
                                    <span
                                        className={`text-xs ${step.id === currentStep ? "text-primary font-medium" : "text-muted-foreground"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mt-[-14px] mx-1 transition-colors ${step.id < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <Separator className="mb-6" />

                <div className="px-1 pb-1">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                            {/* ── STEP 1: Basics ─────────────────────────────────────────── */}
                            {currentStep === 1 && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Product Information</CardTitle>
                                            <CardDescription>Name, description and how this product is categorised</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder='e.g., "Web Hosting", "Media Buying"' {...field} />
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
                                                        <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Describe what this product includes and what it offers clients..."
                                                                className="min-h-20"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Classification</CardTitle>
                                            <CardDescription>Category and service type drive how this product is reported and grouped</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Category ?? visual card picker */}
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {CATEGORIES.map((cat) => (
                                                                <button
                                                                    key={cat.value}
                                                                    type="button"
                                                                    onClick={() => field.onChange(cat.value)}
                                                                    className={`rounded-lg border p-3 text-left transition-colors ${field.value === cat.value
                                                                            ? "border-primary bg-primary/5"
                                                                            : "border-border hover:border-muted-foreground/50"
                                                                        }`}
                                                                >
                                                                    <p className="text-sm font-semibold">{cat.label}</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Service type ?? free text with suggestions */}
                                            <FormField
                                                control={form.control}
                                                name="serviceType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Service Type</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='e.g., "web_hosting", "media_buying", "seo"'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <p className="text-xs text-muted-foreground">
                                                            Lowercase snake_case identifier. Suggestions:
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {(SERVICE_TYPE_SUGGESTIONS[selectedCategory] ?? []).map((s) => (
                                                                <Badge
                                                                    key={s}
                                                                    variant="outline"
                                                                    className="cursor-pointer text-xs hover:bg-accent"
                                                                    onClick={() => form.setValue("serviceType", s)}
                                                                >
                                                                    {s}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {/* ── STEP 2: Features ───────────────────────────────────────── */}
                            {currentStep === 2 && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Product Features</CardTitle>
                                            <CardDescription>
                                                Define the master feature list. Each plan will inherit these and toggle availability.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {featureFields.length === 0 && (
                                                <p className="text-sm text-muted-foreground py-2 text-center">
                                                    No features yet ?? add the key capabilities clients care about.
                                                </p>
                                            )}
                                            {featureFields.map((field, index) => (
                                                <div key={field.id} className="rounded-lg border p-3 space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                                            <FormField
                                                                control={form.control}
                                                                name={`features.${index}.key`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Key</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="storage" className="h-8 text-sm" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`features.${index}.label`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Label</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Storage" className="h-8 text-sm" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="mt-6 h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeFeature(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name={`features.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Short description (optional)"
                                                                        className="h-8 text-sm"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => appendFeature({ key: "", label: "", description: "" })}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Feature
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Marketing Highlights</CardTitle>
                                            <CardDescription>
                                                Key selling points shown on marketing or pricing pages (optional)
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {highlightFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`highlights.${index}.value`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormControl>
                                                                    <Input placeholder='e.g., "Best Value", "Most Popular"' {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removeHighlight(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => appendHighlight({ value: "" })}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Highlight
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {/* ── STEP 3: Options ────────────────────────────────────────── */}
                            {currentStep === 3 && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Visibility & Status</CardTitle>
                                            <CardDescription>Control how this product appears in the system</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Active</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Make this product available for subscriptions
                                                            </p>
                                                        </div>
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
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Popular</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Badge this product as a popular choice
                                                            </p>
                                                        </div>
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
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Recommended</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Badge this product as the recommended option
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Display Order</CardTitle>
                                            <CardDescription>
                                                Lower numbers appear first in lists (0 = default)
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <FormField
                                                control={form.control}
                                                name="sortOrder"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Sort Order</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder="0"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {/* ── Footer navigation ──────────────────────────────────────── */}
                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={currentStep === 1 ? () => onOpenChange(false) : goBack}
                                >
                                    {currentStep === 1 ? "Cancel" : (
                                        <><ChevronLeft className="mr-1 h-4 w-4" />Back</>
                                    )}
                                </Button>

                                {currentStep < STEPS.length ? (
                                    <Button type="button" onClick={goNext}>
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => form.handleSubmit(onSubmit)()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                {isEditing ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            isEditing ? "Update Product" : "Create Product"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
