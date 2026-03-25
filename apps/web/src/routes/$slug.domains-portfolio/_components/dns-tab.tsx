"use client";

import * as React from "react";
import { Monitor, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { DnsTable } from "@/routes/$slug.hosting/_components/dns-table";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface DnsTabProps {
  domain: DomainPortfolio;
  onHostingClick: (type: "web" | "email") => void;
}

export function DnsTab({ domain, onHostingClick }: DnsTabProps) {
  // Check for hosting subscription
  const { data: hostingData, isLoading } = trpc.hosting.getHostingByDomainName.useQuery(
    { domainName: domain.domain },
    { enabled: !!domain.domain }
  );

  const hasHosting = hostingData?.hasHosting ?? false;
  const subscriptionId = hostingData?.subscriptionId;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Checking hosting status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasHosting && subscriptionId) {
    return <DnsTable siteId={Number(subscriptionId)} />;
  }

  // No hosting found - Show CTA
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center py-8 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Monitor className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">DNS Management Required</h3>
          <p className="text-muted-foreground mb-6">
            To manage DNS records for <strong>{domain.domain}</strong>, you need an active hosting subscription.
            Connect a hosting plan to this domain to unlock DNS management, website hosting, and email services.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Button onClick={() => onHostingClick("web")} size="lg" className="w-full">
              <Monitor className="mr-2 h-4 w-4" />
              View Hosting Plans
            </Button>
            <Button onClick={() => onHostingClick("email")} size="lg" variant="outline" className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              View Email Plans
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
