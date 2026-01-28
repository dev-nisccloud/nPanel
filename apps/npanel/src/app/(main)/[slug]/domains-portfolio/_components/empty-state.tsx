"use client";

import { Globe, Plus } from "lucide-react";
import { useAppRouter } from "@/contexts/navigation-loading-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  teamSlug?: string;
}

export function EmptyState({ teamSlug }: EmptyStateProps) {
  const { push } = useAppRouter();
  const registerHref = teamSlug ? `/${teamSlug}/domains` : `/${teamSlug}/dashboard`;

  return (
    <Card className="p-8 text-center">
      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Domains Found</h3>
      <p className="text-muted-foreground mb-4">
        You haven&apos;t registered any domains yet. Start building your domains portfolio by registering your first domain.
      </p>
      <div className="flex justify-center">
        <Button onClick={() => push(registerHref)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Register Your First Domain
        </Button>
      </div>
    </Card>
  );
}
