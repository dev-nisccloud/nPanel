"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import type { DomainPortfolio } from "./domain-portfolio-card";

export type KenicRegistrantInfo = {
  handle?: string;
  name?: string;
  organization?: string;
  email?: string;
  voice?: string;
  fax?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

export type PortfolioContactRow = {
  role: string;
  fullName: string;
  email: string;
  organization?: string;
  phone?: string;
  fax?: string;
  address?: KenicRegistrantInfo["address"];
  handle?: string;
};

type OpenProviderCustomerRecord = {
  handle?: string;
  email?: string;
  company_name?: string;
  name?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
  address?: {
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
    country?: string;
    state?: string;
  };
  phone?: {
    country_code?: string;
    area_code?: string;
    subscriber_number?: string;
  };
  fax?: {
    country_code?: string;
    area_code?: string;
    subscriber_number?: string;
  };
};

function formatOpPhone(
  phone?: OpenProviderCustomerRecord["phone"] | OpenProviderCustomerRecord["fax"],
): string | undefined {
  if (!phone) return undefined;
  const parts = [phone.country_code, phone.area_code, phone.subscriber_number].filter(Boolean);
  if (parts.length === 0) return undefined;
  const joined = parts.join(" ");
  return phone.country_code ? `+${joined.replace(/^\+\+/, "+")}` : joined;
}

export function mapOpenProviderCustomerToContact(
  customer: OpenProviderCustomerRecord,
  role: string,
): PortfolioContactRow {
  const first = customer.name?.first_name ?? "";
  const last = customer.name?.last_name ?? "";
  const fullName =
    customer.name?.full_name?.trim() ||
    [first, last].filter(Boolean).join(" ").trim() ||
    customer.company_name ||
    customer.handle ||
    "";

  const street = customer.address
    ? [customer.address.street, customer.address.number].filter(Boolean).join(" ").trim()
    : undefined;

  return {
    role,
    fullName,
    email: customer.email ?? "",
    organization: customer.company_name || undefined,
    phone: formatOpPhone(customer.phone),
    fax: formatOpPhone(customer.fax),
    address: customer.address
      ? {
          street: street || undefined,
          city: customer.address.city,
          state: customer.address.state,
          postcode: customer.address.zipcode,
          country: customer.address.country,
        }
      : undefined,
    handle: customer.handle,
  };
}

function mapKenicRegistrantToContact(info: KenicRegistrantInfo): PortfolioContactRow {
  return {
    role: "Owner",
    fullName: info.name ?? "",
    email: info.email ?? "",
    organization: info.organization,
    phone: info.voice,
    fax: info.fax,
    address: info.address,
    handle: info.handle,
  };
}

function fallbackContactFromDomain(domain: DomainPortfolio, role = "Owner"): PortfolioContactRow {
  return {
    role,
    fullName: domain.ownerFullName || domain.clientName || "",
    email: domain.clientEmail ?? "",
    organization: domain.ownerCompanyName,
    handle: domain.ownerHandle,
  };
}

function ContactField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">{label}</p>
      {children}
    </div>
  );
}

function ContactAddressBlock({ address }: { address: NonNullable<PortfolioContactRow["address"]> }) {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {address.street && (
        <span>
          {address.street}
          <br />
        </span>
      )}
      {[address.city, address.state].filter(Boolean).join(", ")}
      {address.postcode ? ` ${address.postcode}` : ""}
      {(address.city || address.state || address.postcode) && <br />}
      {address.country}
    </p>
  );
}

function useOpenProviderContact(handle: string | undefined, enabled: boolean) {
  return trpc.openProvider.customers.getByHandle.useQuery(
    { handle: handle! },
    {
      enabled: enabled && !!handle,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  );
}

interface DomainPortfolioContactInfoProps {
  domain: DomainPortfolio;
  source?: "kenic" | "openprovider";
  registrantInfo?: KenicRegistrantInfo | null;
}

export function DomainPortfolioContactInfo({
  domain,
  source,
  registrantInfo,
}: DomainPortfolioContactInfoProps) {
  const [showAll, setShowAll] = React.useState(false);
  const isKenic = source === "kenic";

  const ownerHandle = domain.ownerHandle;
  const adminHandle =
    showAll && !isKenic && domain.adminHandle && domain.adminHandle !== ownerHandle
      ? domain.adminHandle
      : undefined;
  const techHandle =
    showAll && !isKenic && domain.techHandle && domain.techHandle !== ownerHandle
      ? domain.techHandle
      : undefined;
  const billingHandle =
    showAll && !isKenic && domain.billingHandle && domain.billingHandle !== ownerHandle
      ? domain.billingHandle
      : undefined;

  const ownerQuery = useOpenProviderContact(ownerHandle, !isKenic);
  const adminQuery = useOpenProviderContact(adminHandle, !!adminHandle);
  const techQuery = useOpenProviderContact(techHandle, !!techHandle);
  const billingQuery = useOpenProviderContact(billingHandle, !!billingHandle);

  const isLoadingOp = !isKenic && ownerQuery.isLoading;

  const primaryContact = React.useMemo((): PortfolioContactRow => {
    if (isKenic && registrantInfo) {
      return mapKenicRegistrantToContact(registrantInfo);
    }
    if (!isKenic && ownerQuery.data?.data) {
      return mapOpenProviderCustomerToContact(ownerQuery.data.data as OpenProviderCustomerRecord, "Owner");
    }
    return fallbackContactFromDomain(domain);
  }, [isKenic, registrantInfo, ownerQuery.data, domain]);

  const additionalContacts = React.useMemo((): PortfolioContactRow[] => {
    if (isKenic || !showAll) return [];
    const rows: PortfolioContactRow[] = [];
    if (adminQuery.data?.data) {
      rows.push(mapOpenProviderCustomerToContact(adminQuery.data.data as OpenProviderCustomerRecord, "Admin"));
    }
    if (techQuery.data?.data) {
      rows.push(
        mapOpenProviderCustomerToContact(techQuery.data.data as OpenProviderCustomerRecord, "Technical"),
      );
    }
    if (billingQuery.data?.data) {
      rows.push(
        mapOpenProviderCustomerToContact(billingQuery.data.data as OpenProviderCustomerRecord, "Billing"),
      );
    }
    return rows;
  }, [isKenic, showAll, adminQuery.data, techQuery.data, billingQuery.data]);

  const hasOtherHandles =
    !isKenic &&
    ((domain.adminHandle && domain.adminHandle !== ownerHandle) ||
      (domain.techHandle && domain.techHandle !== ownerHandle) ||
      (domain.billingHandle && domain.billingHandle !== ownerHandle));

  const hasExpandableDetails =
    isKenic ||
    !!primaryContact.phone ||
    !!primaryContact.address ||
    !!primaryContact.handle ||
    !!primaryContact.fax ||
    !!primaryContact.organization ||
    hasOtherHandles ||
    (!isKenic && !!ownerHandle);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Contact information</h3>
          {hasExpandableDetails && (
            <Button
              variant="link"
              className="p-0 h-auto text-primary text-xs"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Hide" : "View all"}
            </Button>
          )}
        </div>

        {isLoadingOp ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <ContactField label={primaryContact.role}>
              <p className="text-sm font-medium leading-none">{primaryContact.fullName || "-"}</p>
              {primaryContact.organization && (
                <p className="text-[11px] text-muted-foreground mt-1">{primaryContact.organization}</p>
              )}
            </ContactField>

            {primaryContact.email && (
              <ContactField label="Email">
                <p className="text-sm font-medium break-all">{primaryContact.email}</p>
              </ContactField>
            )}

            {showAll && (
              <>
                {primaryContact.phone && (
                  <ContactField label="Phone">
                    <p className="text-sm font-medium">{primaryContact.phone}</p>
                  </ContactField>
                )}
                {primaryContact.fax && (
                  <ContactField label="Fax">
                    <p className="text-sm font-medium">{primaryContact.fax}</p>
                  </ContactField>
                )}
                {primaryContact.address &&
                  (primaryContact.address.street ||
                    primaryContact.address.city ||
                    primaryContact.address.country) && (
                    <ContactField label="Address">
                      <ContactAddressBlock address={primaryContact.address} />
                    </ContactField>
                  )}
                {primaryContact.handle && (
                  <ContactField label="Registry handle">
                    <p className="text-xs font-mono bg-muted/50 p-1.5 rounded-sm inline-block">
                      {primaryContact.handle}
                    </p>
                  </ContactField>
                )}

                {additionalContacts.length > 0 && (
                  <div className="pt-2 border-t space-y-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Other contacts
                    </p>
                    {additionalContacts.map((contact) => (
                      <div key={`${contact.role}-${contact.handle}`} className="space-y-3 pl-0">
                        <ContactField label={contact.role}>
                          <p className="text-sm font-medium leading-none">{contact.fullName || "-"}</p>
                          {contact.organization && (
                            <p className="text-[11px] text-muted-foreground mt-1">{contact.organization}</p>
                          )}
                        </ContactField>
                        {contact.email && (
                          <ContactField label="Email">
                            <p className="text-sm font-medium break-all">{contact.email}</p>
                          </ContactField>
                        )}
                        {contact.phone && (
                          <ContactField label="Phone">
                            <p className="text-sm font-medium">{contact.phone}</p>
                          </ContactField>
                        )}
                        {contact.handle && (
                          <ContactField label="Handle">
                            <p className="text-xs font-mono bg-muted/50 p-1.5 rounded-sm inline-block">
                              {contact.handle}
                            </p>
                          </ContactField>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isKenic && hasOtherHandles && additionalContacts.length === 0 && (
                  <div className="pt-2 border-t space-y-2 text-sm text-muted-foreground">
                    {(adminQuery.isLoading || techQuery.isLoading || billingQuery.isLoading) && (
                      <Skeleton className="h-4 w-full" />
                    )}
                    {adminHandle && !adminQuery.data && !adminQuery.isLoading && (
                      <p>
                        <span className="font-medium text-foreground">Admin: </span>
                        <span className="font-mono text-xs">{adminHandle}</span>
                      </p>
                    )}
                    {techHandle && !techQuery.data && !techQuery.isLoading && (
                      <p>
                        <span className="font-medium text-foreground">Technical: </span>
                        <span className="font-mono text-xs">{techHandle}</span>
                      </p>
                    )}
                    {billingHandle && !billingQuery.data && !billingQuery.isLoading && (
                      <p>
                        <span className="font-medium text-foreground">Billing: </span>
                        <span className="font-mono text-xs">{billingHandle}</span>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
