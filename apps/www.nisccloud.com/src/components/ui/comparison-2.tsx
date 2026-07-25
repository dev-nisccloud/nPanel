import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator.tsx";

const niscPoints = [
  "One team, one plan — one bill and one clear story",
  "Clear ownership so someone always owns the fix",
  "Brand stays consistent across every channel",
  "Domains, hosting, and growth under one roof",
  "Onboarding without engineering overhead",
  "Local support that understands Kenyan business",
  "Transparent pricing without enterprise runaround",
  "No juggling vendors, invoices, or handoffs",
];

const othersPoints = [
  "Many bills and vendors to chase every month",
  "Nobody owns the fix when something breaks",
  "Inconsistent brand that looks different everywhere",
  "Complex setup that needs technical resources",
  "Email-only support with slow response times",
  "Key features locked behind enterprise plans",
  "Handoffs fall through the cracks between teams",
  "Per-vendor pricing that adds up fast at scale",
];

function CheckRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm bg-primary">
        <Check className="size-3 text-primary-foreground" aria-hidden />
      </span>
      <span className="text-sm text-foreground">{text}</span>
    </li>
  );
}

function CrossRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm bg-muted">
        <X className="size-3 text-muted-foreground" aria-hidden />
      </span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </li>
  );
}

export default function ComparisonBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-4 py-14 text-foreground md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden />
            Sound familiar?
          </Badge>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tired of Paying Separate Teams?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            The vendor mess on the right turns into one clear plan with Nisc
            Cloud — without the enterprise runaround.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-primary/30 ring-1 ring-primary/20">
            <CardHeader className="border-b pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">Nisc Cloud</CardTitle>
                <Badge variant="default">Recommended</Badge>
              </div>
              <CardDescription>
                Everything your business needs, without juggling vendors.
              </CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4">
              <ul className="flex flex-col gap-3">
                {niscPoints.map((point) => (
                  <CheckRow key={point} text={point} />
                ))}
              </ul>
            </CardContent>

            <CardFooter className="border-t">
              <Button asChild className="w-full gap-2 font-semibold">
                <Link to="/contact">
                  Talk to us. It is free.
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader className="border-b pb-6">
              <CardTitle className="text-base font-semibold text-muted-foreground">
                The others
              </CardTitle>
              <CardDescription>
                Common friction teams hit when growth is split across vendors.
              </CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4">
              <ul className="flex flex-col gap-3">
                {othersPoints.map((point) => (
                  <CrossRow key={point} text={point} />
                ))}
              </ul>
            </CardContent>

            <CardFooter className="border-t">
              <Button asChild variant="secondary" className="w-full gap-2 font-semibold">
                <Link to="/services">
                  See why teams switch
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          No pressure. We will map a simple plan for your business in about 30
          minutes.
        </p>
      </div>
    </section>
  );
}
