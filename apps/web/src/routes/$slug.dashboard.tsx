import { useEffect } from "react";

import { captureEvent } from "@/lib/posthog";
import { SectionCards } from "./$slug.dashboard/_components/section-cards";
import { DashboardPromoSection } from "./$slug.dashboard/_components/dashboard-promo-section";
import { DashboardTabs } from "./$slug.dashboard/_components/dashboard-tabs";

export default function DashboardPage() {
  useEffect(() => {
    captureEvent("dashboard_viewed", { user_type: "customer" });
  }, []);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
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
