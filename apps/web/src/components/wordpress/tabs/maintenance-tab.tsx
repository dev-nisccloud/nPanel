"use client";

import * as React from "react";
import { Construction, Settings2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { MaintenanceModeDialog } from "@/routes/$slug.wordpress/_components/maintenance-mode-dialog";
import { trpc } from "@/utils/trpc";

export function WordPressMaintenanceTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const utils = trpc.useUtils();

  const toggleMaintenance = trpc.plesk.wpFeatures.toggleMaintenanceMode.useMutation({
    onSuccess: () => {
      toast.success("Maintenance mode updated");
      utils.plesk.wordpress.getById.invalidate({ id });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <WpFeatureCard
        title="Maintenance mode"
        description="Show a maintenance page to visitors while you work on the site."
        icon={Construction}
        badge={{
          label: features?.maintenance?.status ? "Active" : "Inactive",
          variant: features?.maintenance?.status ? "secondary" : "outline",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Label className="text-sm font-medium">Enable maintenance mode</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={features?.maintenance?.status ?? false}
              disabled={toggleMaintenance.isPending}
              onCheckedChange={(val) => toggleMaintenance.mutate({ installationId: id, status: val })}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-4 w-4" />
              <span className="sr-only">Page content settings</span>
            </Button>
          </div>
        </div>
      </WpFeatureCard>

      <MaintenanceModeDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        installationId={id}
      />
    </div>
  );
}
