"use client";

import * as React from "react";
import { Link } from "react-router";
import { useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageGeneratorInterface } from "./$slug.gen-ai/image-generator/_components/image-generator-interface";
import { AiImageGeneratorPricing } from "./$slug.gen-ai/image-generator/_components/ai-image-generator-pricing";
import { useGetGenerations } from "./$slug.gen-ai/image-generator/_api/use-get-generations";
import { trpc } from "@/utils/trpc";

const AI_IMAGE_GENERATOR_PRODUCT_NAME_PATTERN = /ai\s*image\s*generator/i;
const CREDITS_LOW_THRESHOLD = 7;

function hasAiImageGeneratorSubscription(
  subscriptions: Array<{ productName: string; id: string }> | undefined
): boolean {
  if (!subscriptions?.length) return false;
  return subscriptions.some((s) =>
    AI_IMAGE_GENERATOR_PRODUCT_NAME_PATTERN.test(s.productName)
  );
}

function getAiImageGeneratorSubscriptionId(
  subscriptions: Array<{ productName: string; id: string }> | undefined
): string | null {
  if (!subscriptions?.length) return null;
  const sub = subscriptions.find((s) =>
    AI_IMAGE_GENERATOR_PRODUCT_NAME_PATTERN.test(s.productName)
  );
  return sub?.id ?? null;
}

function parseCreditsNumber(credits: string): number | null {
  const trimmed = credits.trim().toLowerCase();
  if (trimmed === "unlimited" || trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function CustomerImageGeneratorPage() {
  const params = useParams();
  const teamSlug = typeof params?.slug === "string" ? params.slug : "";

  const { data: subscriptions, isLoading: isLoadingSubs } =
    trpc.clientSubscriptions.listForTeam.useQuery(
      { teamSlug },
      { enabled: !!teamSlug }
    );

  const hasSubscription = hasAiImageGeneratorSubscription(subscriptions);
  const aiSubId = getAiImageGeneratorSubscriptionId(subscriptions ?? undefined);

  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug && hasSubscription }
  );

  const { data: generationsData } = useGetGenerations({
    page: 1,
    limit: 50,
    teamId: teamData?.id,
  });
  const hasInProgressGenerations = React.useMemo(() => {
    const list = generationsData?.data ?? [];
    return list.some(
      (g) => g.status === "QUEUED" || g.status === "PROCESSING",
    );
  }, [generationsData?.data]);

  const { data: usageList } = trpc.subscriptionUsage.listForSubscription.useQuery(
    { subscriptionId: aiSubId! },
    {
      enabled: !!aiSubId && hasSubscription,
      refetchInterval: (query) => {
        if (!query.state.data) return false;
        return hasInProgressGenerations ? 2000 : 10000;
      },
      staleTime: 0,
    },
  );

  const creditsValue =
    usageList?.length && usageList[0]
      ? parseCreditsNumber(usageList[0].credits)
      : null;
  const creditsDisplay =
    creditsValue !== null
      ? String(creditsValue)
      : usageList?.length
        ? (usageList[0]?.credits ?? "0")
        : null;
  const isLowCredits =
    creditsValue !== null ? creditsValue <= CREDITS_LOW_THRESHOLD : false;

  if (!teamSlug) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <p className="text-sm text-muted-foreground">Invalid or missing team context.</p>
        </div>
      </div>
    );
  }

  if (isLoadingSubs) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 flex-1 min-h-0">
        <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-xl mb-6" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">AI Image Generator</h1>
            <p className="text-sm text-muted-foreground">
              Subscribe to a plan below to start creating images from text with AI.
            </p>
          </div>
          <div className="mt-6">
            <AiImageGeneratorPricing />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6 flex-1 min-h-0">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1">
            <h1 className="text-base font-semibold tracking-tight">Image generator</h1>
            {creditsDisplay != null &&
              (creditsValue === 0 ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground">You have zero credits.</span>
                  <Button variant="default" size="sm" className="text-white">
                    Purchase more
                  </Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className={
                    "text-base font-semibold px-4 py-1.5 shrink-0 " +
                    (isLowCredits
                      ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800"
                      : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800")
                  }
                >
                  {creditsDisplay} credits
                </Badge>
              ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Create images from your text prompt. For advanced design features, try{" "}
            <Link
              to={teamSlug ? `/${teamSlug}/gen-ai/image-gen-studio` : "#"}
              className="text-primary underline hover:no-underline"
            >
              Visual Studio
            </Link>
            .
          </p>
        </div>
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <ImageGeneratorInterface
          teamId={teamData?.id ?? undefined}
          creditsValue={creditsValue}
        />
        </div>
      </div>
    </div>
  );
}
