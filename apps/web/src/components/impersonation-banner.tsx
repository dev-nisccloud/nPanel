"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

/**
 * Sticky bar shown while an agency super admin is logged in as a customer.
 */
export function ImpersonationBanner() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [stopping, setStopping] = useState(false);

  const impersonatedBy = (
    session?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy;
  const isImpersonating =
    typeof impersonatedBy === "string" && impersonatedBy.length > 0;

  if (!isImpersonating) return null;

  const customerLabel =
    (session?.user as { email?: string | null; name?: string | null } | undefined)
      ?.email ||
    (session?.user as { name?: string | null } | undefined)?.name ||
    "customer";

  const handleStop = async () => {
    if (stopping) return;
    setStopping(true);
    try {
      const result = await authClient.admin.stopImpersonating();
      if (result.error) {
        throw new Error(result.error.message || "Failed to stop impersonation");
      }
      queryClient.clear();
      toast.success("Returned to your agency account");
      window.location.replace("/agency/clients");
    } catch (error: unknown) {
      console.error("Stop impersonation failed:", error);
      setStopping(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to stop impersonation",
      );
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-50 px-4 py-2 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50">
      <p className="text-sm">
        You are viewing the dashboard as <span className="font-medium">{customerLabel}</span>.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-600/40 bg-white/80 hover:bg-white dark:bg-amber-950 dark:hover:bg-amber-900"
        disabled={stopping}
        onClick={() => void handleStop()}
      >
        {stopping ? (
          <>
            <Spinner variant="ellipsis" className="size-4 mr-2" />
            Returning…
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Return to agency
          </>
        )}
      </Button>
    </div>
  );
}
