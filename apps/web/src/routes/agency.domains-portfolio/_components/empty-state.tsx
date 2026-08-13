"use client";

import { ArrowRightLeft, Globe, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <Card className="p-8 text-center">
      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Domains Found</h3>
      <p className="text-muted-foreground mb-4">
        You haven&apos;t registered any domains yet. Start building your domains portfolio by registering your first domain.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => navigate("/agency/domain-transfer")}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer Domain
        </Button>
        <Button onClick={() => navigate("/agency/domains")}>
          <Plus className="mr-2 h-4 w-4" />
          Register Your First Domain
        </Button>
      </div>
    </Card>
  );
}

