"use client";

import * as React from "react";
import { Link } from "react-router";
import { useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplacePricing } from "../_components/marketplace-pricing";
import { MARKETPLACE_SERVICES } from "../marketplace-services";

export default function MarketplaceServicePage() {
  const params = useParams();
  const teamSlug = typeof params?.slug === "string" ? params.slug : "";
  const serviceSlug = typeof params?.serviceSlug === "string" ? params.serviceSlug : "";

  const service = React.useMemo(
    () => MARKETPLACE_SERVICES.find((s) => s.slug === serviceSlug),
    [serviceSlug]
  );

  const title = service?.title ?? serviceSlug.replace(/-/g, " ");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link to={teamSlug ? `/${teamSlug}/marketplace` : "/marketplace"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight capitalize">
            {title}
          </h1>
          {service?.description && (
            <p className="text-sm text-muted-foreground">
              {service.description}
            </p>
          )}
        </div>

        <div className="mt-6">
          <MarketplacePricing serviceSlug={serviceSlug} />
        </div>
      </div>
    </div>
  );
}
