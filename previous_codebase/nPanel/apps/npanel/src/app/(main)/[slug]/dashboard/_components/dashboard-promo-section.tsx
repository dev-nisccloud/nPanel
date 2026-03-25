"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, Globe, Server, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const OFFERS = [
  {
    id: "domain",
    title: "Get a domain",
    description: "Register a domain for your company and manage it from one place.",
    href: (slug: string) => `/${slug}/domains`,
    label: "Get started",
    icon: Globe,
  },
  {
    id: "hosting",
    title: "Set up hosting",
    description: "Deploy and manage your sites with reliable hosting.",
    href: (slug: string) => `/${slug}/hosting`,
    label: "Get started",
    icon: Server,
  },
  {
    id: "subscriptions",
    title: "Manage subscriptions",
    description: "View and manage your active service subscriptions.",
    href: (slug: string) => `/${slug}/subscriptions`,
    label: "View",
    icon: CreditCard,
  },
] as const;

export function DashboardPromoSection() {
  const pathname = usePathname();
  const teamSlug = pathname.split("/")[1] ?? "";
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold leading-tight tracking-tight">
              Recommended for you
            </h2>
            <p className="text-sm text-muted-foreground">
              Quick actions to get the most out of your account.
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0" aria-label={open ? "Collapse" : "Expand"}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OFFERS.map((offer) => {
                const Icon = offer.icon;
                return (
                  <Card key={offer.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold leading-tight">{offer.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={offer.href(teamSlug)}>{offer.label}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
