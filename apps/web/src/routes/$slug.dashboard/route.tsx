"use client";

import { authClient } from "@/lib/auth-client";
import { SectionCards } from "./_components/section-cards";
import { DashboardPromoSection } from "./_components/dashboard-promo-section";
import { DashboardTabs } from "./_components/dashboard-tabs";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const displayName =
    (session?.user as { name?: string; email?: string } | undefined)?.name
    || (session?.user as { email?: string } | undefined)?.email
    || "there";

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to npanel, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Overview of your company&apos;s key metrics and activities
          </p>
        </div>

        <div className="mt-6">
          <SectionCards />
        </div>

        <div className="mt-6">
          <DashboardPromoSection />
        </div>

        <div className="mt-6">
          <DashboardTabs />
        </div>
      </div>
    </div>
  );
}
