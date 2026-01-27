"use client";

import * as React from "react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shown when the customer WordPress detail URL is invalid or decoded slug
 * does not match (e.g. modified / non-existing link). Same pattern as hosting
 * NotFoundPage.
 */
interface InvalidWordPressUrlPageProps {
  teamSlug: string;
}

export function InvalidWordPressUrlPage({ teamSlug }: InvalidWordPressUrlPageProps) {
  const backUrl = teamSlug ? `/${teamSlug}/wordpress` : "/";

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backUrl}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
              <p className="text-muted-foreground">This WordPress link is invalid or not available</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4">
            <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">WordPress installation not found</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-md">
            This link is invalid, or the WordPress installation does not exist or you do not have access to it.
          </p>
          <Link href={backUrl}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to WordPress
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
