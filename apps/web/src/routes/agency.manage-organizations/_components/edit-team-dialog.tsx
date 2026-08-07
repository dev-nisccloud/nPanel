"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
import { trpc } from "@/utils/trpc";

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
  const [formData, setFormData] = React.useState({
    teamName: "",
    currency: "KES",
    logoUrl: "" as string | null,
    teamLogo: null as File | null,
    isActive: true,
  });

  const { data: team, isLoading } = trpc.teams.getById.useQuery(
    { teamId },
    { enabled: open && !!teamId },
  );

  const utils = trpc.useUtils();

  React.useEffect(() => {
    if (team) {
      setFormData({
        teamName: team.name,
        currency: team.baseCurrency,
        logoUrl: team.logoUrl,
        teamLogo: null,
        isActive: team.isActive,
      });
    }
  }, [team]);

  React.useEffect(() => {
    if (!open) {
      setFormData({
        teamName: "",
        currency: "KES",
        logoUrl: null,
        teamLogo: null,
        isActive: true,
      });
    }
  }, [open]);

  const updateTeamMutation = trpc.teams.update.useMutation({
    onSuccess: (_data, variables) => {
      const fieldsChanged = (
        Object.keys(variables) as Array<keyof typeof variables>
      ).filter((key) => key !== "teamId" && variables[key] !== undefined) as string[];
      captureEvent("organization_updated", { fields_changed: fieldsChanged });
      toast.success("Organization updated successfully");
      utils.teams.getAll.invalidate();
      utils.teams.getById.invalidate({ teamId });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update organization");
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, teamLogo: file }));
    }
  };

  const handleSubmit = () => {
    if (!team) return;

    if (!formData.teamName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (formData.teamName.trim().length < 2) {
      toast.error("Organization name must be at least 2 characters");
      return;
    }

    if (formData.teamName.trim().length > 100) {
      toast.error("Organization name must be less than 100 characters");
      return;
    }

    const submitData: {
      teamId: string;
      name?: string;
      baseCurrency?: string;
      logoUrl?: string | null;
      isActive?: boolean;
    } = { teamId };

    if (formData.teamName.trim() !== team.name) {
      submitData.name = formData.teamName.trim();
    }

    if (formData.currency !== team.baseCurrency) {
      submitData.baseCurrency = formData.currency;
    }

    if (formData.logoUrl !== team.logoUrl) {
      submitData.logoUrl = formData.logoUrl;
    }

    if (formData.isActive !== team.isActive) {
      submitData.isActive = formData.isActive;
    }

    if (Object.keys(submitData).length === 1) {
      toast.info("No changes to save");
      return;
    }

    updateTeamMutation.mutate(submitData);
  };

  const logoPreview = formData.teamLogo
    ? URL.createObjectURL(formData.teamLogo)
    : formData.logoUrl || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update organization details. The organization slug cannot be changed after creation.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : !team ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">Organization not found</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-3">
              <Label className="text-sm font-medium">Organization logo</Label>
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Organization logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTeamName" className="text-sm font-medium">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editTeamName"
                placeholder="Enter your organization name"
                value={formData.teamName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, teamName: e.target.value }))
                }
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Slug</Label>
              <Input value={team.slug} disabled className="h-11 font-mono" />
              <p className="text-xs text-muted-foreground">
                Organization slug cannot be changed after creation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCurrency" className="text-sm font-medium">
                Default Currency
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger id="editCurrency" className="h-11 w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">Kenyan Shillings (KES)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLogoUrl" className="text-sm font-medium">
                Logo URL
              </Label>
              <Input
                id="editLogoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    logoUrl: e.target.value || null,
                    teamLogo: null,
                  }))
                }
                className="h-11"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Active status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive organizations are hidden from most workflows
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11"
                disabled={updateTeamMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11"
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
