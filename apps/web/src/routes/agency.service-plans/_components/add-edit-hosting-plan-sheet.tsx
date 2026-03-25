"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { XIcon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { 
  servicePlanTypeSchema, 
  hostingSubTypeSchema, 
  billingCycleSchema 
} from "./schema";
import { 
  getPlanTypeDisplayName, 
  getHostingSubTypeDisplayName,
  getBillingCycleDisplayName 
} from "./service-plans-utils";

// Form Schema for Create Mode - Independent from API schema
const createFormSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(255),
  description: z.string().optional(),
  planType: servicePlanTypeSchema,
  hostingSubType: hostingSubTypeSchema.optional(),
  features: z.array(z.object({
    value: z.string().min(1, "Feature cannot be empty"),
  })).default([]),
  highlights: z.array(z.object({
    value: z.string().min(1, "Highlight cannot be empty"),
  })).default([]),
  isPopular: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  niscPrice: z.string().optional(),
  niscCurrency: z.string().default("KES"),
  billingCycle: billingCycleSchema.default("MONTHLY"),
  setupFee: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  pleskServicePlanId: z.string().optional(),
  pleskFilterId: z.string().optional(),
  pleskIpAddress: z.string().optional(),
}).refine(
  (data) => {
    if (data.planType === "HOSTING" && !data.hostingSubType) {
      return false;
    }
    return true;
  },
  {
    message: "Hosting sub-type is required when plan type is HOSTING",
    path: ["hostingSubType"],
  },
);

// Form Schema for Edit Mode - All fields optional
const editFormSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(255).optional().or(z.literal("")),
  description: z.string().optional(),
  planType: servicePlanTypeSchema.optional(),
  hostingSubType: hostingSubTypeSchema.optional(),
  features: z.array(z.object({
    value: z.string(),
  })).optional(),
  highlights: z.array(z.object({
    value: z.string(),
  })).optional(),
  isPopular: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  niscPrice: z.string().optional(),
  niscCurrency: z.string().optional(),
  billingCycle: billingCycleSchema.optional(),
  setupFee: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  pleskServicePlanId: z.string().optional(),
  pleskFilterId: z.string().optional(),
  pleskIpAddress: z.string().optional(),
});

type FormData = z.infer<typeof createFormSchema>;

interface AddEditHostingPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string | null;
  onSuccess?: () => void;
}

export function AddEditHostingPlanSheet({ 
  open, 
  onOpenChange, 
  planId,
  onSuccess 
}: AddEditHostingPlanSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!planId;

  // Fetch plan data if editing
  const { data: planData, isLoading: isLoadingPlan } = trpc.hostingPlans.getById.useQuery(
    { id: planId! },
    { enabled: isEditing && !!planId }
  );

  // Create mutation
  const createPlan = trpc.hostingPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Service plan created successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating plan:", error);
      toast.error("Failed to create service plan", {
        description: error.message || "Please check your information and try again.",
      });
    },
  });

  // Update mutation
  const updatePlan = trpc.hostingPlans.update.useMutation({
    onSuccess: () => {
      toast.success("Service plan updated successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error updating plan:", error);
      toast.error("Failed to update service plan", {
        description: error.message || "Please check your information and try again.",
      });
    },
  });

  // Use different schema based on edit mode
  const formSchema = isEditing ? editFormSchema : createFormSchema;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      planType: "HOSTING",
      hostingSubType: undefined,
      features: [],
      highlights: [],
      isPopular: false,
      isRecommended: false,
      niscPrice: "",
      niscCurrency: "KES",
      billingCycle: "MONTHLY",
      setupFee: "",
      isActive: true,
      isDefault: false,
      pleskServicePlanId: "",
      pleskFilterId: "",
      pleskIpAddress: "",
    },
  });

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const { fields: highlightFields, append: appendHighlight, remove: removeHighlight } = useFieldArray({
    control: form.control,
    name: "highlights",
  });

  // Populate form when editing
  React.useEffect(() => {
    if (planData && isEditing) {
      form.reset({
        name: planData.name,
        description: planData.description || "",
        planType: planData.planType,
        hostingSubType: planData.hostingSubType || undefined,
        features: planData.features.map(f => ({ value: f })),
        highlights: planData.highlights.map(h => ({ value: h })),
        isPopular: planData.isPopular,
        isRecommended: planData.isRecommended,
        niscPrice: planData.niscPrice || "",
        niscCurrency: planData.niscCurrency,
        billingCycle: planData.billingCycle,
        setupFee: planData.setupFee || "",
        isActive: planData.isActive,
        isDefault: planData.isDefault,
        pleskServicePlanId: planData.pleskServicePlanId || "",
        pleskFilterId: planData.pleskFilterId || "",
        pleskIpAddress: planData.pleskIpAddress || "",
      });
    }
  }, [planData, isEditing, form]);

  // Reset form when closing
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const selectedPlanType = form.watch("planType");
  const selectedPleskPlanId = form.watch("pleskServicePlanId");

  // Fetch Plesk service plans when plan type is HOSTING
  const { data: pleskServicePlansData, isLoading: isLoadingPleskPlans } = trpc.plesk.servicePlans.getAll.useQuery(
    {},
    {
      enabled: open && selectedPlanType === "HOSTING",
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Parse Plesk service plans from XML response
  const pleskServicePlans = React.useMemo(() => {
    if (!pleskServicePlansData?.parsed) return [];
    
    try {
      const plans = (pleskServicePlansData.parsed as any)?.packet?.["service-plan"]?.get?.result;
      if (!plans) return [];
      
      // Handle both single and multiple results
      const planArray = Array.isArray(plans) ? plans : [plans];
      
      return planArray.map((plan: any) => {
        const id = (plan.id?.["#text"] || plan.id)?.toString() || "";
        return {
          id,
          name: plan.name?.["#text"] || plan.name || "",
          description: plan.description?.["#text"] || plan.description || "",
        };
      }).filter((plan: any) => plan.id && plan.name);
    } catch (error) {
      console.error("Error parsing Plesk service plans:", error);
      return [];
    }
  }, [pleskServicePlansData]);

  // Auto-populate pleskFilterId when a Plesk plan is selected
  React.useEffect(() => {
    if (selectedPleskPlanId && selectedPlanType === "HOSTING") {
      // Use the service plan ID as the filter ID
      form.setValue("pleskFilterId", selectedPleskPlanId);
    } else if (!selectedPleskPlanId && selectedPlanType === "HOSTING") {
      // Clear filter ID if no plan is selected
      form.setValue("pleskFilterId", "");
    }
  }, [selectedPleskPlanId, selectedPlanType, form]);

  // Clear Plesk fields when plan type changes away from HOSTING
  React.useEffect(() => {
    if (selectedPlanType !== "HOSTING") {
      form.setValue("pleskServicePlanId", "");
      form.setValue("pleskFilterId", "");
      form.setValue("pleskIpAddress", "");
    }
  }, [selectedPlanType, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && planId) {
        // In edit mode, only send fields that are actually provided and valid
        // Compare with original data to only send changed fields
        const submitData: any = { id: planId };
        
        // Only include name if it's different from original
        if (data.name !== undefined && data.name !== "" && data.name !== planData?.name) {
          submitData.name = data.name;
        }
        
        // Description - only if changed
        if (data.description !== undefined && data.description !== (planData?.description || "")) {
          submitData.description = data.description || undefined;
        }
        
        // Only include planType if it's a valid value and changed
        if (data.planType !== undefined && data.planType !== planData?.planType) {
          submitData.planType = data.planType;
        }
        
        // Only include hostingSubType if it's a valid enum value and changed
        if (data.hostingSubType !== undefined && data.hostingSubType !== null && data.hostingSubType !== planData?.hostingSubType) {
          submitData.hostingSubType = data.hostingSubType;
        }
        
        // Arrays - only include if changed
        if (data.features !== undefined) {
          const validFeatures = data.features.map(f => f.value).filter(v => v && v.trim());
          const originalFeatures = planData?.features || [];
          const featuresChanged = JSON.stringify(validFeatures.sort()) !== JSON.stringify(originalFeatures.sort());
          if (featuresChanged) {
            submitData.features = validFeatures;
          }
        }
        if (data.highlights !== undefined) {
          const validHighlights = data.highlights.map(h => h.value).filter(v => v && v.trim());
          const originalHighlights = planData?.highlights || [];
          const highlightsChanged = JSON.stringify(validHighlights.sort()) !== JSON.stringify(originalHighlights.sort());
          if (highlightsChanged) {
            submitData.highlights = validHighlights;
          }
        }
        
        // Boolean fields - only if changed
        if (data.isPopular !== undefined && data.isPopular !== planData?.isPopular) {
          submitData.isPopular = data.isPopular;
        }
        if (data.isRecommended !== undefined && data.isRecommended !== planData?.isRecommended) {
          submitData.isRecommended = data.isRecommended;
        }
        if (data.isActive !== undefined && data.isActive !== planData?.isActive) {
          submitData.isActive = data.isActive;
        }
        if (data.isDefault !== undefined && data.isDefault !== planData?.isDefault) {
          submitData.isDefault = data.isDefault;
        }
        
        // String fields - only include if they are different from original
        // Use undefined instead of null for optional fields (API schema expects string | undefined)
        if (data.niscPrice !== undefined) {
          const originalPrice = planData?.niscPrice ?? ""; // Convert null to empty string for comparison
          const newPrice = data.niscPrice || ""; // Convert empty to empty string
          if (newPrice !== originalPrice) {
            // Only include if changed, use undefined for empty (not null)
            submitData.niscPrice = newPrice || undefined;
          }
        }
        if (data.niscCurrency !== undefined && data.niscCurrency !== "" && data.niscCurrency !== planData?.niscCurrency) {
          submitData.niscCurrency = data.niscCurrency;
        }
        if (data.billingCycle !== undefined && data.billingCycle !== planData?.billingCycle) {
          submitData.billingCycle = data.billingCycle;
        }
        if (data.setupFee !== undefined) {
          const originalFee = planData?.setupFee ?? ""; // Convert null to empty string
          const newFee = data.setupFee || "";
          if (newFee !== originalFee) {
            submitData.setupFee = newFee || undefined; // Use undefined, not null
          }
        }
        if (data.pleskServicePlanId !== undefined) {
          const originalPlanId = planData?.pleskServicePlanId ?? ""; // Convert null to empty string
          const newPlanId = data.pleskServicePlanId || "";
          if (newPlanId !== originalPlanId) {
            submitData.pleskServicePlanId = newPlanId || undefined; // Use undefined, not null
          }
        }
        if (data.pleskFilterId !== undefined) {
          const originalFilterId = planData?.pleskFilterId ?? ""; // Convert null to empty string
          const newFilterId = data.pleskFilterId || "";
          if (newFilterId !== originalFilterId) {
            submitData.pleskFilterId = newFilterId || undefined; // Use undefined, not null
          }
        }
        if (data.pleskIpAddress !== undefined) {
          const originalIp = planData?.pleskIpAddress ?? ""; // Convert null to empty string
          const newIp = data.pleskIpAddress || "";
          if (newIp !== originalIp) {
            submitData.pleskIpAddress = newIp || undefined; // Use undefined, not null
          }
        }

        await updatePlan.mutateAsync(submitData);
      } else {
        // In create mode, all required fields should be present
        const submitData = {
          name: data.name!,
          description: data.description || undefined,
          planType: data.planType!,
          hostingSubType: data.hostingSubType || undefined,
          features: (data.features || []).map(f => f.value).filter(v => v),
          highlights: (data.highlights || []).map(h => h.value).filter(v => v),
          isPopular: data.isPopular ?? false,
          isRecommended: data.isRecommended ?? false,
          niscPrice: data.niscPrice || undefined,
          niscCurrency: data.niscCurrency || "KES",
          billingCycle: data.billingCycle || "MONTHLY",
          setupFee: data.setupFee || undefined,
          isActive: data.isActive ?? true,
          isDefault: data.isDefault ?? false,
          pleskServicePlanId: data.pleskServicePlanId || undefined,
          pleskFilterId: data.pleskFilterId || undefined,
          pleskIpAddress: data.pleskIpAddress || undefined,
        };

        await createPlan.mutateAsync(submitData);
      }
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in onSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPlan && isEditing) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">
                {isEditing ? "Edit Service Plan" : "Add Service Plan"}
              </SheetTitle>
              <SheetDescription className="text-base">
                {isEditing 
                  ? "Update the service plan details" 
                  : "Create a new NISC service plan for your customers"
                }
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="px-1 pb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                    <CardDescription>Service plan name and description</CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Basic Hosting Plan, SEO Starter Package" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this plan includes..."
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

              {/* Plan Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Plan Type</CardTitle>
                  <CardDescription>Select the type of NISC service plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="planType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {servicePlanTypeSchema.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {getPlanTypeDisplayName(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedPlanType === "HOSTING" && (
                    <FormField
                      control={form.control}
                      name="hostingSubType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hosting Sub-Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              // Only set if it's a valid value, otherwise set to undefined
                              field.onChange(value && value !== "" ? value : undefined);
                            }}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select hosting sub-type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {hostingSubTypeSchema.options.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {getHostingSubTypeDisplayName(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                    <CardDescription>Set the pricing for this service plan</CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="niscPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="niscCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="KES">KES</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {billingCycleSchema.options.map((cycle) => (
                              <SelectItem key={cycle} value={cycle}>
                                {getBillingCycleDisplayName(cycle)}
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
                    name="setupFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Fee</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Features</CardTitle>
                    <CardDescription>List the features included in this service plan</CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  {featureFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`features.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Feature name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendFeature({ value: "" })}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </CardContent>
              </Card>

              {/* Highlights */}
              <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Highlights</CardTitle>
                    <CardDescription>Key selling points for this service plan</CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  {highlightFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`highlights.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Highlight text" {...field} />
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
                    onClick={() => appendHighlight({ value: "" })}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Highlight
                  </Button>
                </CardContent>
              </Card>

              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Options</CardTitle>
                  <CardDescription>Service plan visibility and status options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Popular Service Plan</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Mark this service plan as popular
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                          <FormLabel className="text-base">Recommended Service Plan</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Mark this service plan as recommended
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable this service plan for customers
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default Service Plan</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Set this as the default service plan
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Plesk Settings (only for HOSTING plans) */}
              {selectedPlanType === "HOSTING" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plesk Settings</CardTitle>
                    <CardDescription>Configure Plesk integration settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pleskServicePlanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plesk Service Plan</FormLabel>
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
                                value={field.value || ""}
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
                                    pleskServicePlans.map((plan) => (
                                      <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name}
                                        {plan.description && ` - ${plan.description}`}
                                      </SelectItem>
                                    ))
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
                          <FormLabel>Plesk Filter ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Auto-populated from service plan" 
                              {...field}
                              disabled
                              className="bg-muted"
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
                          <FormLabel>Plesk IP Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 192.168.1.1" 
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditing ? "Update Service Plan" : "Create Service Plan"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

