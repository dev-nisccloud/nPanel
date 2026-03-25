"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@npanel/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const formSchema = z.object({
  teamId: z.string().min(1, "Team is required"),
  hostingPlanId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LinkToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
  onSuccess?: () => void;
}

export function LinkToTeamDialog({
  open,
  onOpenChange,
  installationId,
  onSuccess,
}: LinkToTeamDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
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
  const linkToTeamMutation = trpc.wordpressSubscriptions.linkToTeam.useMutation({
    onSuccess: () => {
      toast.success("WordPress instance linked to team successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link WordPress instance to team");
    },
  });

  const onSubmit = (data: FormData) => {
    linkToTeamMutation.mutate({
      teamId: data.teamId,
      hostingPlanId: data.hostingPlanId || undefined,
      installationId,
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
          <DialogTitle>Link WordPress Instance to Team</DialogTitle>
          <DialogDescription>
            Link this existing WordPress installation to a customer team in your system.
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

            {/* Hosting Plan Selection (Optional) */}
            <FormField
              control={form.control}
              name="hostingPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hosting Plan (Optional)</FormLabel>
                  <FormDescription>
                    Optionally link this WordPress instance to a hosting subscription plan
                  </FormDescription>
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
                        placeholder="Select a hosting plan (optional)..."
                        searchPlaceholder="Search hosting plans..."
                        emptyResults="No hosting plans found"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Installation ID field (disabled and auto-populated) */}
            <FormItem>
              <FormLabel>WordPress Installation ID</FormLabel>
              <FormControl>
                <input
                  type="number"
                  value={installationId}
                  disabled
                  className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-muted cursor-not-allowed"
                  readOnly
                />
              </FormControl>
              <FormDescription>
                Automatically populated from the WordPress installation details.
              </FormDescription>
            </FormItem>

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


