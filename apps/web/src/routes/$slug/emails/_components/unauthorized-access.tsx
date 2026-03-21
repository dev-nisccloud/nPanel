"use client";

import * as React from "react";
import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Component displayed when user tries to access a resource they don't have permission to view
 */
export function UnauthorizedAccess() {
  const pathname = usePathname();
  // Extract team slug from URL (first segment after /)
  const teamSlug = pathname.split("/")[1];
  const backUrl = `/${teamSlug}/emails` as const;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
            <p className="text-muted-foreground">You do not have access to this resource</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <ShieldX className="mx-auto h-16 w-16 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Access Restricted</h3>
        <p className="mb-6 text-sm text-muted-foreground max-w-md">
          You do not have permission to access this hosting subscription. This resource belongs to a different company or account.
        </p>
        <Link href={backUrl}>
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hosting Subscriptions
          </Button>
        </Link>
      </div>
    </div>
  );
}
