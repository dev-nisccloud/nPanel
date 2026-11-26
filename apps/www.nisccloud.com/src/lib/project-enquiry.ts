import { trpcMutation } from "@/lib/domain-search/api.ts";
import { getAttribution } from "@/lib/attribution.ts";
import type { ProjectOffer } from "@/lib/project-packages.ts";

export const TIMEFRAMES = ["As soon as we can", "In 1–3 months", "Later, still exploring"] as const;

export const BUDGETS = {
  KES: [
    { value: "under-50k", label: "Under KES 50,000" },
    { value: "50k-150k", label: "KES 50,000 – 150,000" },
    { value: "150k-500k", label: "KES 150,000 – 500,000" },
    { value: "500k-plus", label: "KES 500,000+" },
    { value: "not-sure", label: "Not sure yet" },
  ],
  USD: [
    { value: "under-400-usd", label: "Under USD 400" },
    { value: "400-1200-usd", label: "USD 400 – 1,200" },
    { value: "1200-4000-usd", label: "USD 1,200 – 4,000" },
    { value: "4000-plus-usd", label: "USD 4,000+" },
    { value: "not-sure", label: "Not sure yet" },
  ],
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ProjectEnquiry = {
  packageId: string;
  projectType: string;
  timeframe: string;
  budget: string;
  ready: string[];
  name: string;
  email: string;
  phone: string;
  company: string;
};

export function sendProjectEnquiry(offer: ProjectOffer, enquiry: ProjectEnquiry) {
  const selected = offer.packages.find((item) => item.id === enquiry.packageId);
  const readyLabels = offer.readyOptions
    .filter((option) => enquiry.ready.includes(option.value))
    .map((option) => option.label);
  const typeLabel = offer.projectTypes.find((option) => option.value === enquiry.projectType)?.label;
  const attributionLines = Object.entries(getAttribution())
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`);
  const message = [
    `Package: ${selected?.name ?? enquiry.packageId}`,
    `Project: ${typeLabel ?? enquiry.projectType}`,
    `Start: ${enquiry.timeframe}`,
    readyLabels.length > 0 ? `Already in place: ${readyLabels.join(", ")}` : "Already in place: not specified",
    `Enquiry source: ${offer.id} (${window.location.pathname})`,
    ...attributionLines,
  ].join("\n");

  return trpcMutation("storefront.leads.submit", {
    name: enquiry.name.trim(),
    email: enquiry.email.trim(),
    phone: enquiry.phone.trim() || undefined,
    company: enquiry.company.trim() || undefined,
    service: offer.serviceValue,
    serviceName: `${offer.serviceLabel}: ${selected?.name ?? "Package"}`,
    budget: enquiry.budget,
    plan: selected?.name,
    message,
    source: "contact",
  });
}
