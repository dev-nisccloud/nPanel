"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import type { DomainPortfolio } from "./domain-portfolio-card";
import { DomainContactEditDialog } from "./domain-contact-edit-dialog";

export type KenicRegistrantInfo = {
  handle?: string;
  name?: string;
  organization?: string;
  email?: string;
  voice?: string;
  fax?: string;
  address?: {
    street?: string | string[];
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

export type KenicHandlers = {
  owner?: KenicRegistrantInfo | null;
  admin?: KenicRegistrantInfo | null;
  tech?: KenicRegistrantInfo | null;
  billing?: KenicRegistrantInfo | null;
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

function roleHint(role: string) {
  if (role === "Admin") return "Manages the domain, including transfers and contact changes.";
  if (role === "Technical") return "Handles nameservers and technical problems.";
  if (role === "Billing") return "Receives renewal and billing notices.";
  return "The registrant, and the legal contact for the domain.";
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
  const street = Array.isArray(address.street) ? address.street.filter(Boolean).join(" ") : address.street;
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {street && (
        <span>
          {street}
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
  kenicHandlers?: KenicHandlers | null;
  canEdit?: boolean;
  allowReplace?: boolean;
  teamSlug?: string;
  onContactUpdated?: () => void | Promise<void>;
}

export function DomainPortfolioContactInfo({
  domain,
  source,
  registrantInfo,
  kenicHandlers,
  canEdit = false,
  allowReplace = true,
  teamSlug,
  onContactUpdated,
}: DomainPortfolioContactInfoProps) {
  const [showAll, setShowAll] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const { data: session } = authClient.useSession();
  const isSuperAdmin =
    (session?.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN";
  const showEdit = canEdit && (isSuperAdmin || !allowReplace);
  const isKenic = source === "kenic";
  const domainId = Number.parseInt(String(domain.id), 10);
  const liveHandlesQuery = trpc.openProvider.domains.getHandles.useQuery(
    { domainId: Number.isFinite(domainId) ? domainId : 0 },
    { enabled: !isKenic && Number.isFinite(domainId) && domainId > 0, staleTime: 60_000 },
  );
  const liveHandles = liveHandlesQuery.data;

  const ownerHandle =
    (isKenic ? kenicHandlers?.owner?.handle : liveHandles?.owner || domain.ownerHandle) || domain.ownerHandle;
  const adminHandle = isKenic ? kenicHandlers?.admin?.handle : liveHandles?.admin || domain.adminHandle;
  const techHandle = isKenic ? kenicHandlers?.tech?.handle : liveHandles?.tech || domain.techHandle;
  const billingHandle = isKenic ? kenicHandlers?.billing?.handle : liveHandles?.billing || domain.billingHandle;

  const ownerQuery = useOpenProviderContact(ownerHandle, !isKenic);
  const adminQuery = useOpenProviderContact(adminHandle, showAll && !isKenic && !!adminHandle);
  const techQuery = useOpenProviderContact(techHandle, showAll && !isKenic && !!techHandle);
  const billingQuery = useOpenProviderContact(billingHandle, showAll && !isKenic && !!billingHandle);

  const isLoadingOp = !isKenic && ownerQuery.isLoading;

  const primaryContact = React.useMemo((): PortfolioContactRow => {
    const kenicOwner = kenicHandlers?.owner ?? registrantInfo;
    if (isKenic && kenicOwner) {
      return mapKenicRegistrantToContact(kenicOwner);
    }
    if (!isKenic && ownerQuery.data?.data) {
      return mapOpenProviderCustomerToContact(ownerQuery.data.data as OpenProviderCustomerRecord, "Owner");
    }
    return fallbackContactFromDomain(domain);
  }, [isKenic, registrantInfo, kenicHandlers?.owner, ownerQuery.data, domain]);

  const additionalContacts = React.useMemo(() => {
    if (!showAll) return [];
    const rows: PortfolioContactRow[] = [];
    const pushKenic = (info: KenicRegistrantInfo | null | undefined, role: string) => {
      if (!info && !role) return;
      if (!info?.handle && !info?.name && !info?.email) return;
      rows.push(
        info ? { ...mapKenicRegistrantToContact(info), role } : fallbackContactFromDomain(domain, role),
      );
    };
    const pushOp = (
      data: OpenProviderCustomerRecord | undefined,
      handle: string | undefined,
      role: string,
      loading: boolean,
      supported: boolean | undefined,
    ) => {
      if (supported === false && !handle && !data) return;
      if (data) {
        rows.push(mapOpenProviderCustomerToContact(data, role));
        return;
      }
      if (!handle && !loading && supported !== true) return;
      rows.push({ role, fullName: loading ? "" : "—", email: "", handle });
    };

    if (isKenic) {
      pushKenic(kenicHandlers?.admin, "Admin");
      pushKenic(kenicHandlers?.tech, "Technical");
      pushKenic(kenicHandlers?.billing, "Billing");
    } else {
      pushOp(adminQuery.data?.data as OpenProviderCustomerRecord | undefined, adminHandle, "Admin", adminQuery.isLoading, liveHandles?.support?.admin);
      pushOp(techQuery.data?.data as OpenProviderCustomerRecord | undefined, techHandle, "Technical", techQuery.isLoading, liveHandles?.support?.tech);
      pushOp(billingQuery.data?.data as OpenProviderCustomerRecord | undefined, billingHandle, "Billing", billingQuery.isLoading, liveHandles?.support?.billing);
    }
    return rows;
  }, [
    showAll,
    isKenic,
    kenicHandlers,
    domain,
    adminHandle,
    techHandle,
    billingHandle,
    adminQuery.data,
    adminQuery.isLoading,
    techQuery.data,
    techQuery.isLoading,
    billingQuery.data,
    billingQuery.isLoading,
    liveHandles?.support,
  ]);

  const hasOtherHandlers = isKenic
    ? !!(kenicHandlers?.admin || kenicHandlers?.tech || kenicHandlers?.billing)
    : !!(
        adminHandle ||
        techHandle ||
        billingHandle ||
        liveHandles?.support?.admin ||
        liveHandles?.support?.tech ||
        liveHandles?.support?.billing
      );

  const hasExpandableDetails =
    isKenic ||
    !!primaryContact.phone ||
    !!primaryContact.address ||
    !!primaryContact.handle ||
    !!primaryContact.fax ||
    !!primaryContact.organization ||
    hasOtherHandlers ||
    (!isKenic && !!ownerHandle);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-semibold text-sm">Contact information</h3>
          <div className="flex items-center gap-3">
            {showEdit && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary text-xs"
                onClick={() => setEditOpen(true)}
                disabled={isLoadingOp}
              >
                Edit
              </Button>
            )}
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
              {showAll && (
                <p className="text-[11px] text-muted-foreground mt-1">{roleHint(primaryContact.role)}</p>
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
                          <p className="text-sm font-medium leading-none">{contact.fullName || "—"}</p>
                          {contact.organization && (
                            <p className="text-[11px] text-muted-foreground mt-1">{contact.organization}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1">{roleHint(contact.role)}</p>
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
                        {contact.address &&
                          (contact.address.street || contact.address.city || contact.address.country) && (
                            <ContactField label="Address">
                              <ContactAddressBlock address={contact.address} />
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

                {!isKenic &&
                  hasOtherHandlers &&
                  (adminQuery.isLoading || techQuery.isLoading || billingQuery.isLoading) &&
                  additionalContacts.every((row) => !row.fullName && !row.email) && (
                    <Skeleton className="h-4 w-full" />
                  )}
              </>
            )}
          </div>
        )}
      </CardContent>
      {showEdit && (
        <DomainContactEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          domain={domain}
          source={source}
          registrantInfo={registrantInfo ?? kenicHandlers?.owner}
          kenicHandlers={kenicHandlers}
          opCustomer={!isKenic ? (ownerQuery.data?.data as OpenProviderCustomerRecord | undefined) : undefined}
          opCustomerLoading={!isKenic && ownerQuery.isLoading}
          allowReplace={allowReplace}
          teamSlug={teamSlug}
          onUpdated={onContactUpdated}
        />
      )}
    </Card>
  );
}
