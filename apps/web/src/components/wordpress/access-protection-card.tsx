"use client";

import * as React from "react";
import { Link2, Lock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WpActionSwitch } from "@/components/wordpress/wp-action-switch";
import { HotlinkProtectionSheet } from "@/components/wordpress/hotlink-protection-sheet";
import { PasswordProtectionDialog } from "@/components/wordpress/password-protection-dialog";
import { trpc } from "@/utils/trpc";
import { wpInstallationFields } from "@/components/wordpress/wp-optimistic";

type ProtectionFlags = {
  available?: boolean;
  status?: boolean;
};

export function AccessProtectionCard({
  installationId,
  hotlinkProtection,
  passwordProtection,
}: {
  installationId: number;
  hotlinkProtection?: ProtectionFlags;
  passwordProtection?: ProtectionFlags;
}) {
  const [hotlinkOpen, setHotlinkOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const utils = trpc.useUtils();

  const hotlinkOpt = wpInstallationFields(utils, installationId, ["hotlinkProtection"]);

  const toggleHotlink = trpc.plesk.wpFeatures.updateHotlinkProtectionStatus.useMutation({
    onMutate: hotlinkOpt.onMutate,
    onSuccess: () => toast.success("Hotlink protection updated"),
    onError: (e, _vars, ctx) => {
      toast.error(e.message);
      hotlinkOpt.rollback(ctx);
    },
    onSettled: () => utils.plesk.wordpress.getById.invalidate({ id: installationId }),
  });

  const hotlinkAvailable = hotlinkProtection?.available !== false;

  return (
    <>
      <Card className="overflow-hidden py-0 gap-0">
        <CardHeader className="border-b bg-muted/30 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Access protection
          </CardTitle>
          <CardDescription className="text-xs">
            Hotlink blocking and HTTP basic authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <div className="flex flex-col justify-between gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Hotlink protection
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Block external embedding of media
                  </p>
                </div>
                <Badge
                  variant={hotlinkProtection?.status ? "default" : "secondary"}
                  className="text-xs"
                >
                  {hotlinkProtection?.status ? "On" : "Off"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Enabled</Label>
                  <WpActionSwitch
                    checked={hotlinkProtection?.status ?? false}
                    disabled={!hotlinkAvailable}
                    loading={toggleHotlink.isPending}
                    onCheckedChange={(val) =>
                      toggleHotlink.mutate({ installationId, status: val })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  disabled={!hotlinkAvailable}
                  onClick={() => setHotlinkOpen(true)}
                >
                  Allowed domains
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">Password protection</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Restrict site access with credentials
                  </p>
                </div>
                <Badge
                  variant={passwordProtection?.status ? "default" : "secondary"}
                  className="text-xs"
                >
                  {passwordProtection?.status ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setPasswordOpen(true)}
                >
                  Configure credentials
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <HotlinkProtectionSheet
        open={hotlinkOpen}
        onOpenChange={setHotlinkOpen}
        installationId={installationId}
      />
      <PasswordProtectionDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        installationId={installationId}
      />
    </>
  );
}
