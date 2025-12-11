"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link2 } from "lucide-react";
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

const formSchema = z.object({
  teamId: z.string().min(1, "Team is required"),
  hostingPlanId: z.string().min(1, "Hosting plan is required"),
  billingCycle: z.enum(["YEARLY", "MONTHLY", "BIENNIALLY", "CUSTOM"]).optional(),
  nextRenewalDate: z.date().optional(),
  expiryDate: z.date().optional(),
  primaryDomain: z.string().optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface LinkToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  pleskFilterId: string;
  hostingType?: string;
  onSuccess?: () => void;
}

export function LinkToTeamDialog({
  open,
  onOpenChange,
  subscriptionId,
  pleskFilterId,
  hostingType,
  onSuccess,
}: LinkToTeamDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoRenew: true,
    },
  });

  // Fetch teams for combobox
  const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: open,
  });

  // Fetch hosting plans for combobox
  const { data: hostingPlans = [], isLoading: isLoadingPlans } = trpc.hostingPlans.getAll.useQuery(
    { isActive: true },
    {
      enabled: open,
    }
  );

  // Create mutation
  const linkToTeamMutation = trpc.hosting.linkToTeam.useMutation({
    onSuccess: () => {
      toast.success("Subscription linked to team successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link subscription to team");
    },
  });

  const onSubmit = (data: FormData) => {
    // Map Plesk htype to our enum format
    // Plesk might return values like "vrt_hst" or other formats, we need to map them
    const validHostingTypes = ["WEB_HOSTING", "EMAIL_HOSTING", "RESELLER_HOSTING", "VPS_HOSTING", "DEDICATED_HOSTING"] as const;
    
    // Map common Plesk htype values to our enum
    const htypeMap: Record<string, typeof validHostingTypes[number]> = {
      "vrt_hst": "WEB_HOSTING",
      "standard": "WEB_HOSTING",
      "web_hosting": "WEB_HOSTING",
      "email_hosting": "EMAIL_HOSTING",
      "reseller_hosting": "RESELLER_HOSTING",
      "vps_hosting": "VPS_HOSTING",
      "dedicated_hosting": "DEDICATED_HOSTING",
    };
    
    let validHostingType: typeof validHostingTypes[number] | undefined = undefined;
    if (hostingType) {
      // Try direct match first
      if (validHostingTypes.includes(hostingType.toUpperCase() as any)) {
        validHostingType = hostingType.toUpperCase() as typeof validHostingTypes[number];
      } else if (htypeMap[hostingType.toLowerCase()]) {
        // Try mapping
        validHostingType = htypeMap[hostingType.toLowerCase()];
      }
    }

    // Ensure dates are Date objects (handle both Date objects and ISO strings)
    const nextRenewalDate = data.nextRenewalDate 
      ? (data.nextRenewalDate instanceof Date ? data.nextRenewalDate : new Date(data.nextRenewalDate))
      : undefined;
    
    const expiryDate = data.expiryDate 
      ? (data.expiryDate instanceof Date ? data.expiryDate : new Date(data.expiryDate))
      : undefined;

    linkToTeamMutation.mutate({
      subscriptionId,
      teamId: data.teamId,
      hostingPlanId: data.hostingPlanId,
      pleskFilterId, // Auto-populated from hosting details
      hostingType: validHostingType, // Only send if valid enum value
      billingCycle: data.billingCycle,
      nextRenewalDate,
      expiryDate,
      primaryDomain: data.primaryDomain?.trim() || undefined, // Convert empty strings to undefined
      notes: data.notes?.trim() || undefined, // Convert empty strings to undefined
      autoRenew: data.autoRenew,
    });
  };

  // Convert teams to combobox items
  const teamItems: ComboboxItem[] = React.useMemo(() => {
    return teams.map((team) => ({
      id: team.id,
      label: team.name,
    }));
  }, [teams]);

  // Convert hosting plans to combobox items
  const hostingPlanItems: ComboboxItem[] = React.useMemo(() => {
    return hostingPlans.map((plan) => ({
      id: plan.id,
      label: plan.name,
    }));
  }, [hostingPlans]);

  const selectedTeam = React.useMemo(() => {
    const teamId = form.watch("teamId");
    return teamItems.find((team) => team.id === teamId);
  }, [form.watch("teamId"), teamItems]);

  const selectedHostingPlan = React.useMemo(() => {
    const planId = form.watch("hostingPlanId");
    return hostingPlanItems.find((plan) => plan.id === planId);
  }, [form.watch("hostingPlanId"), hostingPlanItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6" hideClose>
        <DialogHeader className="pb-4">
          <DialogTitle>Link Subscription to Team</DialogTitle>
          <DialogDescription>
            Link this existing Plesk subscription to a customer team in your system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Team Selection */}
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <FormControl>
                    {isLoadingTeams ? (
                      <div className="flex items-center justify-center h-10 border rounded-md">
                        <Spinner size={20} />
                        <span className="ml-2 text-sm text-muted-foreground">Loading teams...</span>
                      </div>
                    ) : (
                      <ComboboxDropdown
                        items={teamItems}
                        selectedItem={selectedTeam}
                        onSelect={(team) => field.onChange(team.id)}
                        placeholder="Select a team..."
                        searchPlaceholder="Search teams..."
                        emptyResults="No teams found"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

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

            {/* Optional Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="primaryDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Domain (Optional)</FormLabel>
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
                      onValueChange={field.onChange}
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
                          onChange={field.onChange}
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
                disabled={linkToTeamMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={linkToTeamMutation.isPending}
              >
                {linkToTeamMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Link to Team
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

