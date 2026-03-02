"use client";

import { Globe, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({ teamSlug }: { teamSlug: string }) {
  return (
    <Card className="p-8 text-center">
      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Domains Found</h3>
      <p className="text-muted-foreground mb-4">
        You haven&apos;t registered any domains yet. Get your first domain to get started.
      </p>
      <Button asChild className="w-fit">
        <Link href={teamSlug ? `/${teamSlug}/domains` : "/domains"}>
          <Plus className="mr-2 h-4 w-4" />
          Get a Domain
        </Link>
      </Button>
    </Card>
  );
}

