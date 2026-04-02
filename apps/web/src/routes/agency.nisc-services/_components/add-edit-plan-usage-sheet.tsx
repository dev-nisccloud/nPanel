"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

// ---------------------------------------------------------------------------
// Independent UI schema for plan usage form (data transformation only)
// ---------------------------------------------------------------------------

const usageOveruseSchema = z.enum(["HARD", "SOFT"]);

const planUsageFormSchema = z.object({
  usageKind: z.string().min(1, "Usage kind is required").max(100),
  limitValue: z.string().min(1, "Limit value is required"),
  overuse: usageOveruseSchema,
  period: z.string().max(50).optional().or(z.literal("")),
});

type PlanUsageFormData = z.infer<typeof planUsageFormSchema>;

function toFormData(api: {
  usageKind: string;
  limitValue: string;
  overuse: string;
  period?: string | null;
}): PlanUsageFormData {
  return {
    usageKind: api.usageKind ?? "",
    limitValue: api.limitValue ?? "",
    overuse: (api.overuse === "SOFT" ? "SOFT" : "HARD") as "HARD" | "SOFT",
    period: api.period ?? "",
  };
}

function fromFormData(data: PlanUsageFormData): {
  usageKind: string;
  limitValue: string;
  overuse: "HARD" | "SOFT";
  period?: string | null;
} {
  return {
    usageKind: data.usageKind.trim(),
    limitValue: data.limitValue.trim(),
    overuse: data.overuse,
    period: data.period?.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddEditPlanUsageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productPlanId: string;
  planName: string;
  /** When null, create mode; when set, edit mode. */
  existingUsageId: string | null;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddEditPlanUsageSheet({
  open,
  onOpenChange,
  productId,
  productPlanId,
  planName,
  existingUsageId,
  onSuccess,
}: AddEditPlanUsageSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = existingUsageId != null && existingUsageId !== "";

  const { data: usageData, isLoading: isLoadingUsage } =
    trpc.products.getPlanUsageById.useQuery(
      { id: existingUsageId! },
      { enabled: isEditing && !!existingUsageId }
    );

  const createUsage = trpc.products.createPlanUsage.useMutation({
    onSuccess: () => {
      toast.success("Usage settings added");
      onOpenChange(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message ?? "Failed to add usage settings"),
  });

  const updateUsage = trpc.products.updatePlanUsage.useMutation({
    onSuccess: () => {
      toast.success("Usage settings updated");
      onOpenChange(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message ?? "Failed to update usage settings"),
  });

  const form = useForm<PlanUsageFormData>({
    resolver: zodResolver(planUsageFormSchema),
    defaultValues: {
      usageKind: "",
      limitValue: "",
      overuse: "HARD",
      period: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (isEditing && usageData) {
      form.reset(toFormData(usageData));
    } else if (!isEditing) {
      form.reset({
        usageKind: "",
        limitValue: "",
        overuse: "HARD",
        period: "",
      });
    }
  }, [open, isEditing, usageData, form]);

  const onSubmit = (data: PlanUsageFormData) => {
    const payload = fromFormData(data);
    setIsSubmitting(true);
    if (isEditing && existingUsageId) {
      updateUsage.mutate(
        {
          id: existingUsageId,
          usageKind: payload.usageKind,
          limitValue: payload.limitValue,
          overuse: payload.overuse,
          period: payload.period ?? undefined,
        },
        {
          onSettled: () => setIsSubmitting(false),
        }
      );
    } else {
      createUsage.mutate(
        {
          productId,
          productPlanId,
          usageKind: payload.usageKind,
          limitValue: payload.limitValue,
          overuse: payload.overuse,
          period: payload.period ?? undefined,
        },
        {
          onSettled: () => setIsSubmitting(false),
        }
      );
    }
  };

  if (isLoadingUsage && isEditing) {
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
      <SheetContent className="flex flex-col overflow-hidden max-w-xl">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>
            {isEditing ? "Edit usage" : "Create usage"}
          </SheetTitle>
          <SheetDescription>
            {planName} — {isEditing ? "Update usage limit and overuse behaviour" : "Add usage settings for this plan"}
          </SheetDescription>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="absolute right-6 top-6">
              <XIcon className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col min-h-0 flex-1 gap-4 py-4"
          >
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <FormField
                control={form.control}
                name="usageKind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage kind</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. image_generations, background_removals"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="limitValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 100, unlimited"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="overuse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overuse</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HARD">Hard (block when over limit)</SelectItem>
                        <SelectItem value="SOFT">Soft (allow and flag)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. MONTHLY, YEARLY"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {isEditing ? "Updating..." : "Adding..."}
                  </>
                ) : isEditing ? (
                  "Update settings"
                ) : (
                  "Add settings"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
