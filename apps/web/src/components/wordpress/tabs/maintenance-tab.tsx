"use client";

import * as React from "react";
import { Construction, Settings2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WpActionSwitch } from "@/components/wordpress/wp-action-switch";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { useWpInstallationSummary } from "@/components/wordpress/use-wp-installation-summary";
import { MaintenanceModeDialog } from "@/routes/$slug.wordpress/_components/maintenance-mode-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";
import { wpInstallationFields } from "@/components/wordpress/wp-optimistic";

export function WordPressMaintenanceTab({ installationId }: { installationId: string }) {
  const { id, features } = useWpInstallationSummary(installationId);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const utils = trpc.useUtils();

  const maintenanceOpt = wpInstallationFields(utils, id, ["maintenance"]);

  const toggleMaintenance = trpc.plesk.wpFeatures.toggleMaintenanceMode.useMutation({
    onMutate: maintenanceOpt.onMutate,
    onSuccess: () => toast.success("Maintenance mode updated"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      maintenanceOpt.rollback(ctx);
    },
    onSettled: () => utils.plesk.wordpress.getById.invalidate({ id }),
  });

  const [EnableMaintenanceDialog, confirmEnableMaintenance] = useConfirm(
    "Enable maintenance mode?",
    "Visitors will see a maintenance page instead of your site until you turn this off.",
  );

  return (
    <>
      <EnableMaintenanceDialog />
      <WpFeatureCard
        title="Maintenance mode"
        description="Show a maintenance page to visitors while you work on the site."
        icon={Construction}
        badge={{
          label: features?.maintenance?.status ? "Active" : "Inactive",
          variant: features?.maintenance?.status ? "secondary" : "outline",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label className="text-sm">Enable maintenance mode</Label>
          <div className="flex items-center gap-2">
            <WpActionSwitch
              checked={features?.maintenance?.status ?? false}
              loading={toggleMaintenance.isPending}
              onCheckedChange={async (val) => {
                if (val) {
                  const ok = await confirmEnableMaintenance();
                  if (!ok) return;
                }
                toggleMaintenance.mutate({ installationId: id, status: val });
              }}
            />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
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
    </>
  );
}
