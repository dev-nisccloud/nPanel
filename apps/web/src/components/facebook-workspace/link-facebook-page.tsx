"use client";

import * as React from "react";
import { Building2, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";
import { trpc } from "@/utils/trpc";

export function LinkFacebookPageOrganization({ pageId, linkedTeamId }: { pageId: string; linkedTeamId?: string | null }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = React.useState(false);
  const [teamId, setTeamId] = React.useState("");
  const linkQuery = trpc.customerOAuth.facebookPages.organizationLink.useQuery(
    { pageId },
    { enabled: Boolean(pageId), staleTime: Number.POSITIVE_INFINITY, refetchOnWindowFocus: false },
  );
  const teamsQuery = trpc.teams.getAll.useQuery(undefined, { enabled: open });
  const linkOrganization = trpc.customerOAuth.facebookPages.linkOrganization.useMutation({
    onSuccess: async (result) => {
      toast.success(`Linked to ${result.teamName}`);
      setOpen(false);
      setTeamId("");
      await utils.customerOAuth.facebookPages.list.invalidate();
      utils.customerOAuth.facebookPages.organizationLink.setData({ pageId }, (current) =>
        current ? { ...current, teamId: result.teamId, teamName: result.teamName } : current,
      );
    },
    onError: (error) => toast.error(error.message || "Failed to link organization"),
  });

  React.useEffect(() => {
    setOpen(false);
    setTeamId("");
  }, [pageId]);

  const alreadyLinked = Boolean(linkedTeamId || linkQuery.data?.teamId);
  const teamItems: ComboboxItem[] = React.useMemo(
    () =>
      [...(teamsQuery.data ?? [])]
        .filter((team) => team.isActive)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((team) => ({ id: team.id, label: team.name, keywords: [team.slug] })),
    [teamsQuery.data],
  );
  const selectedTeam = teamItems.find((item) => item.id === teamId);
  const button = (
    <Button variant="outline" size="sm" className="w-full" disabled={alreadyLinked || !pageId} onClick={() => setOpen(true)}>
      <Link2 className="mr-2 h-4 w-4" />
      {alreadyLinked ? "Linked to organization" : "Link to organization"}
    </Button>
  );

  return (
    <>
      {alreadyLinked ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex w-full">{button}</span>
            </TooltipTrigger>
            <TooltipContent>
              {linkQuery.data?.teamName ? `Already linked to ${linkQuery.data.teamName}` : "Already linked to an organization"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (linkOrganization.isPending) return;
          setOpen(next);
          if (!next) setTeamId("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link page to organization</DialogTitle>
            <DialogDescription>
              Members of this organization can view {linkQuery.data?.pageName || "this Page"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Organization
            </p>
            {teamsQuery.isLoading ? (
              <div className="flex h-10 items-center justify-center rounded-md border">
                <Spinner size={16} />
              </div>
            ) : (
              <ComboboxDropdown
                items={teamItems}
                selectedItem={selectedTeam}
                onSelect={(item) => setTeamId(item.id)}
                placeholder="Select an organization..."
                searchPlaceholder="Search organizations..."
                emptyResults="No organizations found"
                disabled={linkOrganization.isPending}
                inDialog
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={linkOrganization.isPending}>
              Cancel
            </Button>
            <Button disabled={!teamId || linkOrganization.isPending} onClick={() => linkOrganization.mutate({ pageId, teamId })}>
              {linkOrganization.isPending ? "Linking..." : "Link organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
