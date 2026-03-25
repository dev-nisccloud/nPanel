"use client";

import { ArrowRightLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Domain Transfers</h3>
      <p className="text-muted-foreground mb-4">
        You haven&apos;t initiated any domain transfers yet. Start by transferring a domain from another registrar to your agency.
      </p>
      <Button onClick={() => {/* TODO: Open transfer form */}}>
        <Plus className="mr-2 h-4 w-4" />
        Initiate Domain Transfer
      </Button>
    </Card>
  );
}

