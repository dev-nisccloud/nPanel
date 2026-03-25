"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

const editFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  baseCurrency: z.string().length(3, "Currency must be a 3-letter code").optional(),
  logoUrl: z.string().url("Invalid URL").nullable().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    return data.name !== undefined || data.baseCurrency !== undefined || data.logoUrl !== undefined || data.isActive !== undefined;
  },
  {
    message: "At least one field must be provided for update",
  },
);

type FormData = z.infer<typeof editFormSchema>;

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess?: () => void;
}

export function EditTeamDialog({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: EditTeamDialogProps) {
  const { data: team, isLoading } = trpc.teams.getById.useQuery(
    { teamId },
    { enabled: open && !!teamId }
  );

  const form = useForm<FormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      baseCurrency: "",
      logoUrl: null,
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        baseCurrency: team.baseCurrency,
        logoUrl: team.logoUrl,
        isActive: team.isActive,
      });
    }
  }, [team, form]);

  const updateTeamMutation = trpc.teams.update.useMutation({
    onSuccess: () => {
      toast.success("Team updated successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update team");
    },
  });

  const onSubmit = (data: FormData) => {
    if (!team) return;

    const submitData: any = { teamId };

    if (data.name !== undefined && data.name !== team.name) {
      submitData.name = data.name;
    }

    if (data.baseCurrency !== undefined && data.baseCurrency !== team.baseCurrency) {
      submitData.baseCurrency = data.baseCurrency;
    }

    if (data.logoUrl !== undefined && data.logoUrl !== team.logoUrl) {
      submitData.logoUrl = data.logoUrl;
    }

    if (data.isActive !== undefined && data.isActive !== team.isActive) {
      submitData.isActive = data.isActive;
    }

    if (Object.keys(submitData).length > 1) {
      updateTeamMutation.mutate(submitData);
    } else {
      toast.info("No changes to save");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!team) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">Team not found</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6" hideClose>
        <DialogHeader className="pb-4">
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team information. Only changed fields will be updated. Slug cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Slug - read-only */}
            <FormItem>
              <FormLabel>Slug (Read-only)</FormLabel>
              <FormControl>
                <Input value={team.slug} disabled className="font-mono" />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Team slug cannot be changed after creation
              </p>
            </FormItem>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="KES" maxLength={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://example.com/logo.png" 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
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
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Whether the team is active or inactive
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={updateTeamMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

