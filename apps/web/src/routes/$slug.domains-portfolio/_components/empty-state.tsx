"use client";

import { ArrowRightLeft, Globe, Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({ teamSlug }: { teamSlug: string }) {
  const domainsHref = teamSlug ? `/${teamSlug}/domains` : "/domains";
  const transferHref = teamSlug ? `/${teamSlug}/domain-transfer` : "/domain-transfer";

  return (
    <Card className="p-8 text-center">
      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-1">No Domains Found</h3>
      <p className="text-muted-foreground mb-2">
        You haven&apos;t registered any domains yet. Get your first domain to get started.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline" className="w-fit">
          <Link to={transferHref}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer Domain
          </Link>
        </Button>
        <Button asChild className="w-fit">
          <Link to={domainsHref}>
            <Plus className="mr-2 h-4 w-4" />
            Get a Domain
          </Link>
        </Button>
      </div>
    </Card>
  );
}

