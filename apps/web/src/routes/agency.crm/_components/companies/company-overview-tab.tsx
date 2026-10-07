import { Building2, MapPin } from "lucide-react";

import {
  CrmActiveBadge,
  CrmField,
  CrmFieldGrid,
  CrmFieldRow,
  CrmInfoCard,
  displayText,
  formatCrmDate,
  formatCrmMoney,
} from "../crm-detail";
import { RecordCustomFields } from "../record-custom-fields";
import { RecordTags, tagRefsFromAssignments, type TagRef } from "../record-tags";

interface CompanyOverviewTabProps {
  company: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    size: string | null;
    description: string | null;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    linkedinUrl: string | null;
    annualRevenue: string | null;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    owner: { name: string | null } | null;
    customFields?: Record<string, unknown> | null;
    tags?: Array<{ tag?: { id: string; name: string; color: string | null } | null }>;
  };
}

function websiteHref(website: string) {
  return website.includes("://") ? website : `https://${website}`;
}

export function CompanyOverviewTab({ company }: CompanyOverviewTabProps) {
  const tags: TagRef[] = tagRefsFromAssignments(company.tags);
  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
      <CrmInfoCard icon={Building2} title="Company" description="Account details">
        <CrmFieldGrid>
          <CrmFieldRow>
            <CrmField label="Industry">{displayText(company.industry)}</CrmField>
            <CrmField label="Size">{displayText(company.size)}</CrmField>
          </CrmFieldRow>
          <CrmFieldRow>
            <CrmField label="Website">
              {company.website ? (
                <a
                  href={websiteHref(company.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                "—"
              )}
            </CrmField>
            <CrmField label="Email">
              {company.email ? (
                <a href={`mailto:${company.email}`} className="hover:underline">
                  {company.email}
                </a>
              ) : (
                "—"
              )}
            </CrmField>
          </CrmFieldRow>
          <CrmFieldRow>
            <CrmField label="Phone">
              {company.phone ? (
                <a href={`tel:${company.phone}`} className="hover:underline">
                  {company.phone}
                </a>
              ) : (
                "—"
              )}
            </CrmField>
            <CrmField label="Annual revenue">
              {formatCrmMoney(company.annualRevenue)}
            </CrmField>
          </CrmFieldRow>
          <CrmFieldRow>
            <CrmField label="Status">
              <CrmActiveBadge active={company.isActive} />
            </CrmField>
            <CrmField label="Owner">{displayText(company.owner?.name)}</CrmField>
          </CrmFieldRow>
          {company.description ? (
            <div className="space-y-1 px-4 py-3">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm text-foreground">{company.description}</p>
            </div>
          ) : null}
        </CrmFieldGrid>
      </CrmInfoCard>

      <CrmInfoCard icon={MapPin} title="Location" description="Address and record dates">
        <CrmFieldGrid>
          <CrmFieldRow>
            <CrmField label="Address">{displayText(company.addressLine1)}</CrmField>
            <CrmField label="Address line 2">{displayText(company.addressLine2)}</CrmField>
          </CrmFieldRow>
          <CrmFieldRow>
            <CrmField label="City">{displayText(company.city)}</CrmField>
            <CrmField label="State">{displayText(company.state)}</CrmField>
          </CrmFieldRow>
          <CrmFieldRow>
            <CrmField label="Country">{displayText(company.country)}</CrmField>
            <CrmField label="Postal code">{displayText(company.postalCode)}</CrmField>
          </CrmFieldRow>
          <CrmFieldRow>
            <CrmField label="Created">{formatCrmDate(company.createdAt)}</CrmField>
            <CrmField label="Updated">{formatCrmDate(company.updatedAt)}</CrmField>
          </CrmFieldRow>
          {company.linkedinUrl ? (
            <div className="space-y-1 px-4 py-3">
              <p className="text-xs text-muted-foreground">LinkedIn</p>
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {company.linkedinUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ) : null}
        </CrmFieldGrid>
      </CrmInfoCard>
    </div>
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <RecordTags kind="company" recordId={company.id} tags={tags} />
      <RecordCustomFields
        entityType="company"
        recordId={company.id}
        values={company.customFields}
      />
    </div>
    </div>
  );
}
