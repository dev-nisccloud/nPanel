"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nPanel/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxDropdown, type ComboboxItem } from "@nPanel/ui/combobox-dropdown";
import { DatePicker } from "@/components/npanel-ui/date-picker";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

function addBillingPeriod(
  date: Date,
  cycle: "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM"
): Date {
  const next = new Date(date);
  if (cycle === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (cycle === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else if (cycle === "BIENNIALLY") next.setFullYear(next.getFullYear() + 2);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

// Edit form schema - all fields optional
const editFormSchema = z.object({
  hostingPlanId: z.string().optional(),
  billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
  nextRenewalDate: z.date().optional(),
  expiryDate: z.date().optional(),
  primaryDomain: z.string().optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().optional(),
});

type FormData = z.infer<typeof editFormSchema>;

interface EditSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  initialData?: {
    hostingPlanId: string;
    primaryDomain: string | null;
    billingCycle: string;
    nextRenewalDate: Date | null;
    expiryDate: Date | null;
    notes: string | null;
    autoRenew: boolean;
  } | null;
  onSuccess?: () => void;
}

export function EditSubscriptionDialog({
  open,
  onOpenChange,
  subscriptionId,
  initialData,
  onSuccess,
}: EditSubscriptionDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      autoRenew: true,
    },
  });

  // Fetch hosting plans for combobox
  const { data: hostingPlans = [], isLoading: isLoadingPlans } = trpc.hostingPlans.getAll.useQuery(
    { isActive: true },
    {
      enabled: open,
    }
  );

  const utils = trpc.useUtils();

  // Update mutation
  const updateSubscriptionMutation = trpc.hosting.updateSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription updated successfully");
      form.reset();
      onOpenChange(false);
      // Invalidate subscription queries to refresh data
      utils.hosting.getByPleskFilterId.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update subscription");
    },
  });

  // Populate form when initial data is available
  React.useEffect(() => {
    if (initialData && open) {
      form.reset({
        hostingPlanId: initialData.hostingPlanId,
        billingCycle: initialData.billingCycle as any,
        nextRenewalDate: initialData.nextRenewalDate || undefined,
        expiryDate: initialData.expiryDate || undefined,
        primaryDomain: initialData.primaryDomain || "",
        notes: initialData.notes || "",
        autoRenew: initialData.autoRenew,
      });
    }
  }, [initialData, open, form]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: FormData) => {
    // Only send fields that have changed from initial data
    const submitData: any = { subscriptionId };

    if (initialData) {
      if (data.hostingPlanId !== undefined && data.hostingPlanId !== initialData.hostingPlanId) {
        submitData.hostingPlanId = data.hostingPlanId;
      }
      if (data.billingCycle !== undefined && data.billingCycle !== initialData.billingCycle) {
        submitData.billingCycle = data.billingCycle;
      }
      if (data.nextRenewalDate !== undefined) {
        const originalDate = initialData.nextRenewalDate 
          ? (initialData.nextRenewalDate instanceof Date ? initialData.nextRenewalDate.getTime() : new Date(initialData.nextRenewalDate).getTime())
          : null;
        const newDateValue = data.nextRenewalDate instanceof Date 
          ? data.nextRenewalDate 
          : data.nextRenewalDate ? new Date(data.nextRenewalDate) : null;
        const newDate = newDateValue?.getTime() || null;
        if (originalDate !== newDate) {
          submitData.nextRenewalDate = newDateValue || undefined;
        }
      }
      if (data.expiryDate !== undefined) {
        const originalDate = initialData.expiryDate 
          ? (initialData.expiryDate instanceof Date ? initialData.expiryDate.getTime() : new Date(initialData.expiryDate).getTime())
          : null;
        const newDateValue = data.expiryDate instanceof Date 
          ? data.expiryDate 
          : data.expiryDate ? new Date(data.expiryDate) : null;
        const newDate = newDateValue?.getTime() || null;
        if (originalDate !== newDate) {
          submitData.expiryDate = newDateValue || undefined;
        }
      }
      if (data.primaryDomain !== undefined) {
        const originalDomain = initialData.primaryDomain || "";
        const newDomain = data.primaryDomain || "";
        if (originalDomain !== newDomain) {
          submitData.primaryDomain = newDomain || undefined;
        }
      }
      if (data.notes !== undefined) {
        const originalNotes = initialData.notes || "";
        const newNotes = data.notes || "";
        if (originalNotes !== newNotes) {
          submitData.notes = newNotes || undefined;
        }
      }
      if (data.autoRenew !== undefined && data.autoRenew !== initialData.autoRenew) {
        submitData.autoRenew = data.autoRenew;
      }
    } else {
      // If no initial data, send all provided fields
      if (data.hostingPlanId !== undefined) submitData.hostingPlanId = data.hostingPlanId;
      if (data.billingCycle !== undefined) submitData.billingCycle = data.billingCycle;
      if (data.nextRenewalDate !== undefined) {
        submitData.nextRenewalDate = data.nextRenewalDate instanceof Date 
          ? data.nextRenewalDate 
          : new Date(data.nextRenewalDate);
      }
      if (data.expiryDate !== undefined) {
        submitData.expiryDate = data.expiryDate instanceof Date 
          ? data.expiryDate 
          : new Date(data.expiryDate);
      }
      if (data.primaryDomain !== undefined) submitData.primaryDomain = data.primaryDomain || undefined;
      if (data.notes !== undefined) submitData.notes = data.notes || undefined;
      if (data.autoRenew !== undefined) submitData.autoRenew = data.autoRenew;
    }

    // Check if any fields were changed
    if (Object.keys(submitData).length === 1) {
      toast.error("No changes detected. Please modify at least one field.");
      return;
    }

    updateSubscriptionMutation.mutate(submitData);
  };

  // Convert hosting plans to combobox items
  const hostingPlanItems: ComboboxItem[] = React.useMemo(() => {
    return hostingPlans.map((plan) => ({
      id: plan.id,
      label: plan.name,
    }));
  }, [hostingPlans]);

  const selectedHostingPlan = React.useMemo(() => {
    const planId = form.watch("hostingPlanId");
    return hostingPlanItems.find((plan) => plan.id === planId);
  }, [form.watch("hostingPlanId"), hostingPlanItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6" hideClose>
        <DialogHeader className="pb-4">
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update the subscription details. Only changed fields will be saved.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hosting Plan Selection */}
            <FormField
              control={form.control}
              name="hostingPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hosting Plan</FormLabel>
                  <FormControl>
                    {isLoadingPlans ? (
                      <div className="flex items-center justify-center h-10 border rounded-md">
                        <Spinner size={20} />
                        <span className="ml-2 text-sm text-muted-foreground">Loading hosting plans...</span>
                      </div>
                    ) : (
                      <ComboboxDropdown
                        items={hostingPlanItems}
                        selectedItem={selectedHostingPlan}
                        onSelect={(plan) => field.onChange(plan.id)}
                        placeholder="Select a hosting plan..."
                        searchPlaceholder="Search hosting plans..."
                        emptyResults="No hosting plans found"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Required Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="primaryDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Domain</FormLabel>
                    <FormDescription>
                      The primary domain for this hosting subscription
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
                    </FormControl>
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
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const nextRenewal = form.getValues("nextRenewalDate");
                        if (nextRenewal) {
                          form.setValue(
                            "expiryDate",
                            addBillingPeriod(nextRenewal, value as "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM")
                          );
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                        <SelectItem value="BIENNIALLY">Biennially</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nextRenewalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Renewal Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={(date) => {
                            field.onChange(date);
                            const cycle = form.getValues("billingCycle");
                            if (date && cycle) {
                              form.setValue(
                                "expiryDate",
                                addBillingPeriod(date, cycle as "YEARLY" | "MONTHLY" | "BIENNIALLY" | "CUSTOM")
                              );
                            }
                          }}
                          placeholder="Pick a date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Pick a date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormDescription>
                      Additional notes about this subscription
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoRenew"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Auto Renew</FormLabel>
                      <FormDescription>
                        Automatically renew this subscription when it expires
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={updateSubscriptionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateSubscriptionMutation.isPending}
              >
                {updateSubscriptionMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Subscription
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

