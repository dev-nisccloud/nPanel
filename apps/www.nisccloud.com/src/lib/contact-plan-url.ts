export function buildContactPlanUrl(params: {
  serviceName: string;
  planName: string;
  planPrice: number;
  planPeriod: string;
  serviceSlug?: string;
}) {
  const periodLabel = params.planPeriod.replace(/^mo$/i, "month").replace(/^yr$/i, "year");
  const isCustomQuote = params.planPrice === 0 || params.planPeriod === "quote";
  const message = isCustomQuote
    ? [
        `Hi Nisc Cloud team,`,
        ``,
        `I'm interested in a custom quote for ${params.serviceName}.`,
        ``,
        `Please share next steps and pricing for a tailored package.`,
      ].join("\n")
    : [
        `Hi Nisc Cloud team,`,
        ``,
        `I'm interested in the ${params.planName} plan for ${params.serviceName} (KES ${params.planPrice.toLocaleString()}/${periodLabel}).`,
        ``,
        `Please share next steps to get started.`,
      ].join("\n");

  const search = new URLSearchParams({
    service: params.serviceSlug ?? "market",
    serviceName: params.serviceName,
    plan: params.planName,
    planPrice: String(params.planPrice),
    planPeriod: params.planPeriod,
    message,
  });

  return `/contact?${search.toString()}`;
}
