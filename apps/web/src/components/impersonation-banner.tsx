"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

/**
 * Fixed control shown while an agency super admin is logged in as a customer.
 * It stays centered on the viewport and does not take space in the page.
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
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-[min(100vw-2rem,24rem)] items-center gap-2 rounded-full border border-red-300 bg-red-100 px-3 py-1.5 text-red-950 shadow-lg dark:border-red-800 dark:bg-red-950/80 dark:text-red-50">
        <p className="min-w-0 truncate text-xs">
          Viewing as <span className="font-medium">{customerLabel}</span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 shrink-0 rounded-full border-red-300 bg-white/80 px-2.5 text-xs text-red-950 hover:bg-white dark:border-red-700 dark:bg-red-950 dark:text-red-50 dark:hover:bg-red-900"
          disabled={stopping}
          onClick={() => void handleStop()}
        >
          {stopping ? (
            <>
              <Spinner variant="ellipsis" className="mr-1.5 size-3.5" />
              Returning…
            </>
          ) : (
            <>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Return
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
