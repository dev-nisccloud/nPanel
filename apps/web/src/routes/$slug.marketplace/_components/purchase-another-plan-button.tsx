"use client";

import { Plus } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

import {
  marketplaceSlugForService,
  type CustomerPlanService,
} from "../marketplace-services";

export function PurchaseAnotherPlanButton({ service }: { service: CustomerPlanService }) {
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";
  const { data: products = [] } = trpc.products.getAll.useQuery(
    { isActive: true },
    { staleTime: 5 * 60 * 1000 },
  );
  const serviceSlug = marketplaceSlugForService(products, service);
  if (!teamSlug || !serviceSlug) return null;

  return (
    <Button size="sm" asChild>
      <Link to={`/${teamSlug}/marketplace/${serviceSlug}`}>
        <Plus className="mr-1.5 h-4 w-4" />
        Purchase another plan
      </Link>
    </Button>
  );
}
