"use client";

import { Globe, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState() {
  const router = useRouter();
  
  return (
    <Card className="p-8 text-center">
      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Domains Found</h3>
      <p className="text-muted-foreground mb-4">
        You haven&apos;t registered any domains yet. Start building your domains portfolio by registering your first domain.
      </p>
      <Button onClick={() => router.push("/agency/domains")}>
        <Plus className="mr-2 h-4 w-4" />
        Register Your First Domain
      </Button>
    </Card>
  );
}

