"use client";

import * as React from "react";
import { Building2, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

export interface LinkKenicDomainToTeamTarget {
  /** Portfolio id, usually `kenic-${subscriptionId}` */
  id: string;
  domain: string;
}

interface LinkKenicDomainToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: LinkKenicDomainToTeamTarget | null;
  onSuccess?: () => void;
}

function subscriptionIdFromPortfolioId(id: string): string {
  return id.startsWith("kenic-") ? id.slice("kenic-".length) : id;
}

export function LinkKenicDomainToTeamDialog({
  open,
  onOpenChange,
  domain,
  onSuccess,
}: LinkKenicDomainToTeamDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: teams = [], isLoading: isLoadingTeams } = trpc.teams.getAll.useQuery(undefined, {
    enabled: open,
  });

  const updateMutation = trpc.clientSubscriptions.update.useMutation({
    onSuccess: async () => {
      toast.success("Domain linked to team");
      setConfirmOpen(false);
      onOpenChange(false);
      resetForm();
      await Promise.all([
        utils.kenic.domainList.list.invalidate(),
        utils.clientSubscriptions.getById.invalidate(),
        utils.clientSubscriptions.listForAgency.invalidate(),
        utils.clientSubscriptions.listForTeamDomains.invalidate(),
      ]);
      onSuccess?.();
    },
    onError: (error) => {
      setSubmitError(error.message);
      setConfirmOpen(false);
    },
  });

  function resetForm() {
    setSelectedTeamId("");
    setConfirmOpen(false);
    setSubmitError(null);
  }

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const teamItems: ComboboxItem[] = React.useMemo(
    () => teams.map((t) => ({ id: t.id, label: t.name })),
    [teams],
  );

  const selectedTeam = teamItems.find((t) => t.id === selectedTeamId);

  const handleContinue = () => {
    setSubmitError(null);
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!domain || !selectedTeamId) return;
    setSubmitError(null);
    updateMutation.mutate({
      id: subscriptionIdFromPortfolioId(domain.id),
      teamId: selectedTeamId,
    });
  };

  const isSubmitting = updateMutation.isPending;
  const domainName = domain?.domain ?? "this domain";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (isSubmitting) return;
          onOpenChange(next);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to team</DialogTitle>
            <DialogDescription>
              Link {domainName} to a customer team so it appears in their Domains Portfolio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Team *
              </Label>
              {isLoadingTeams ? (
                <div className="flex h-10 items-center justify-center rounded-md border">
                  <Spinner size={18} />
                </div>
              ) : (
                <ComboboxDropdown
                  items={teamItems}
                  selectedItem={selectedTeam}
                  onSelect={(item) => setSelectedTeamId(item.id)}
                  placeholder="Select a team..."
                  searchPlaceholder="Search teams..."
                  emptyResults="No teams found"
                  disabled={isSubmitting}
                />
              )}
            </div>

            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              This updates the existing Domains subscription for this KENIC domain. It does not create
              a new subscription.
            </div>

            {submitError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleContinue} disabled={isSubmitting || !selectedTeamId}>
              <Users className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (isSubmitting) return;
          setConfirmOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm link to team?</AlertDialogTitle>
            <AlertDialogDescription>
              Link <span className="font-medium text-foreground">{domainName}</span> to{" "}
              <span className="font-medium text-foreground">
                {selectedTeam?.label ?? "the selected team"}
              </span>
              ? The domain will appear in that team&apos;s Domains Portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Linking…
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Link to team
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
