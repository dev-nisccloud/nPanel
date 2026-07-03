import { trpcQuery } from "@/lib/domain-search/api.ts";

export type WhoisContact = {
  name: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  country: string | null;
};

export type WhoisRegistrar = {
  name: string | null;
  handle: string | null;
  ianaId: string | null;
  url: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  abuseEmail: string | null;
  abusePhone: string | null;
};

export type WhoisDsData = {
  keyTag: number;
  algorithm: number;
  digestType: number;
  digest: string;
};

export type WhoisDomainEvent = {
  action: string;
  date: string;
  actor: string | null;
};

export type WhoisData = {
  domain: string;
  handle: string | null;
  unicodeName: string | null;
  source: "rdap";
  registrationDate: string | null;
  expiryDate: string | null;
  updatedDate: string | null;
  transferDate: string | null;
  status: string[];
  registrar: WhoisRegistrar | null;
  registrant: WhoisContact | null;
  adminContact: WhoisContact | null;
  techContact: WhoisContact | null;
  nameservers: string[];
  dnssec: "signedDelegation" | "unsigned" | null;
  dsData: WhoisDsData[];
  events: WhoisDomainEvent[];
  rdapUrl: string | null;
  error: string | null;
};

/** Public tRPC procedure — no auth required. */
export function fetchWhoisLookup(domain: string): Promise<WhoisData> {
  return trpcQuery<WhoisData>("whois.lookup", { domain });
}
