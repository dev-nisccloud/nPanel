import type { RelatedLegalLink } from "./LegalPageShell.tsx";

export const LEGAL_DOCUMENTS: RelatedLegalLink[] = [
  {
    label: "Terms of Service",
    href: "/terms",
    description: "The agreement that governs every Nisc Cloud service, including billing, refunds and disputes.",
  },
  {
    label: "Service Level Agreement",
    href: "/sla",
    description: "Uptime, support response times, backups and service credits for hosting, email, servers and domains.",
  },
  {
    label: "Acceptable Use Policy",
    href: "/acceptable-use",
    description: "What you can and cannot host, send or run on Nisc Cloud services.",
  },
  {
    label: "Data Processing Addendum",
    href: "/dpa",
    description: "How we process personal data on your behalf under the Kenya Data Protection Act, 2019.",
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
    description: "How we collect, use and protect your personal data.",
  },
  {
    label: "Cookie Policy",
    href: "/cookies",
    description: "Which cookies nisccloud.com uses and how to manage them.",
  },
];

export function relatedLegalDocuments(currentHref: string): RelatedLegalLink[] {
  return LEGAL_DOCUMENTS.filter((doc) => doc.href !== currentHref);
}
