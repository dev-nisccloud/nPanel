"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

type AdPlatform = "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS" | "INSTAGRAM_ADS";

interface CreateMediaBuyingSubscriptionDialogProps {
  platform: AdPlatform;
  accountId: string;
  accountName?: string | null;
}

export function CreateMediaBuyingSubscriptionDialog({
  platform,
  accountId,
  accountName,
}: CreateMediaBuyingSubscriptionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [teamId, setTeamId] = React.useState("");
  const [productPlanId, setProductPlanId] = React.useState("");
  const [adServingFee, setAdServingFee] = React.useState("");
  const [adServingFeeCurrency, setAdServingFeeCurrency] = React.useState<"USD" | "EUR" | "KES">("KES");

  const utils = trpc.useUtils();
  const { data: mediaBuyingProduct, isLoading: isLoadingProduct } =
    trpc.clientSubscriptions.getMediaBuyingProductForSubscription.useQuery();
  const { data: teams = [], isLoading: isLoadingTeams } =
    trpc.teams.getAll.useQuery();
  const { data: linkedData, isLoading: isLoadingLink } =
    trpc.clientSubscriptions.getLinkedMediaBuyingSubscriptionByAdAccount.useQuery(
      { platform, accountId },
      { enabled: accountId.length > 0 },
    );

  const createMutation =
    trpc.clientSubscriptions.createMediaBuyingSubscription.useMutation({
      onSuccess: () => {
        toast.success("Media buying subscription created successfully");
        setOpen(false);
        setTeamId("");
        setProductPlanId("");
        setAdServingFee("");
        setAdServingFeeCurrency("KES");
        utils.clientSubscriptions.getLinkedMediaBuyingSubscriptionByAdAccount.invalidate({
          platform,
          accountId,
        });
        utils.clientSubscriptions.getAll.invalidate();
        utils.clientSubscriptions.listForAgency.invalidate();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create media buying subscription");
      },
    });

  const isLinked = linkedData?.hasLinkedSubscription === true;
  const selectedTeam = teams.find((team) => team.id === teamId);
  const selectedPlan = mediaBuyingProduct?.plans.find((plan) => plan.id === productPlanId);

  const handleSubmit = () => {
    if (!teamId) {
      toast.error("Please select a team");
      return;
    }
    if (!productPlanId) {
      toast.error("Please select a media buying plan");
      return;
    }
    if (!adServingFee.trim()) {
      toast.error("Please provide ad serving fee");
      return;
    }

    createMutation.mutate({
      teamId,
      productPlanId,
      platform,
      accountId,
      accountName: accountName ?? undefined,
      adServingFee: adServingFee.trim(),
      adServingFeeCurrency,
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={isLinked ? "outline" : "default"}
        disabled={isLoadingLink || isLinked || accountId.length === 0}
        onClick={() => setOpen(true)}
      >
        {isLoadingLink ? "Checking..." : isLinked ? `Linked to ${linkedData?.teamName ?? "team"}` : "Create Subscription"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Media Buying Subscription</DialogTitle>
            <DialogDescription>
              Create a team subscription for the selected ad account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Media Buying Product & Plan</Label>
              <Select
                value={productPlanId}
                onValueChange={setProductPlanId}
                disabled={isLoadingProduct || createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingProduct ? "Loading plans..." : "Select a plan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(mediaBuyingProduct?.plans ?? []).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                      {plan.agreedCommissionRate != null
                        ? ` — ${plan.agreedCommissionRate}% of ad spend`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ad Serving Fee</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
                <Input
                  value={adServingFee}
                  onChange={(event) => setAdServingFee(event.target.value)}
                  placeholder="e.g. 10% or 15000"
                  disabled={createMutation.isPending}
                />
                <Select
                  value={adServingFeeCurrency}
                  onValueChange={(value) => setAdServingFeeCurrency(value as "USD" | "EUR" | "KES")}
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selected Ad Account</Label>
              <Input
                value={accountName?.trim() ? `${accountName} (${accountId})` : accountId}
                disabled
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Link to Team</Label>
              <Select
                value={teamId}
                onValueChange={setTeamId}
                disabled={isLoadingTeams || createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingTeams ? "Loading teams..." : "Select a team"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedTeam || selectedPlan) && (
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                {selectedTeam ? `Team: ${selectedTeam.name}` : ""}
                {selectedTeam && selectedPlan ? " · " : ""}
                {selectedPlan ? (
                  <>
                    Plan: {selectedPlan.name}
                    {selectedPlan.agreedCommissionRate != null
                      ? ` (${selectedPlan.agreedCommissionRate}% of ad spend)`
                      : ""}
                  </>
                ) : (
                  ""
                )}
                {(selectedTeam || selectedPlan) && adServingFee.trim().length > 0 ? " · " : ""}
                {adServingFee.trim().length > 0 ? `Ad Serving Fee: ${adServingFee.trim()} ${adServingFeeCurrency}` : ""}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                teamId.length === 0 ||
                productPlanId.length === 0 ||
                adServingFee.trim().length === 0
              }
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

