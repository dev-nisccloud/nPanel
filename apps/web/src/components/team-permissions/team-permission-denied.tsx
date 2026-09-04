"use client";

import { ArrowLeft, ShieldX } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export function TeamPermissionDenied({ teamSlug }: { teamSlug: string }) {
  const homeHref = `/${teamSlug}/dashboard`;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <ShieldX className="mb-4 h-14 w-14 text-destructive" />
      <h1 className="text-lg font-semibold tracking-tight">Access restricted</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have permission to view this page. Ask a company owner to grant access in
        Settings → User Permissions.
      </p>
      <Button asChild className="mt-6">
        <Link to={homeHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
