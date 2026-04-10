"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cronJobs } from "./agency.cronjobs/_components/jobs";
import { CRON_JOB_KEYS } from "./agency.cronjobs/_components/jobs";
import { MediaBuyingEomTotalSpendInvoicesFlow } from "./agency.cronjobs/_components/media-buying-eom-flow";

export default function AgencyCronJobDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const jobKey = (params as any)?.jobKey as string | undefined;

  const job = React.useMemo(() => {
    if (!jobKey) return null;
    return cronJobs.find((j) => j.key === jobKey) ?? null;
  }, [jobKey]);

  if (!job) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/agency/cronjobs")} className="-ml-2 h-8 w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="mt-6">
            <h1 className="text-base font-semibold tracking-tight">Cron job not found</h1>
            <p className="text-xs text-muted-foreground mt-1">
              The selected cron job does not exist in this build.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/agency/cronjobs")}
          className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground group"
        >
          <ArrowLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Cron Jobs
        </Button>

        <div className="mt-4 flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">{job.name}</h1>
          <p className="text-xs text-muted-foreground">{job.description ?? ""}</p>
        </div>

        <div className="mt-6">
          {job.key === CRON_JOB_KEYS.MEDIA_BUYING_EOM_TOTAL_SPEND_INVOICES ? (
            <MediaBuyingEomTotalSpendInvoicesFlow />
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm">
                Flow UI not implemented for this job yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

