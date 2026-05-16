"use client";

import * as React from "react";
import {
  Phone,
  MapPin,
  User,
  Mail,
  Megaphone,
  FileText,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

interface ProfileInformationProps {
  userId: string;
}

function PrefBadge({ value }: { value: boolean | null | undefined }) {
  if (value === true) {
    return (
      <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200">
        Yes
      </Badge>
    );
  }
  if (value === false) {
    return <Badge variant="secondary" className="text-xs">No</Badge>;
  }
  return <Badge variant="outline" className="text-xs text-muted-foreground">Not set</Badge>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 items-start">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

const EMAIL_PREFS = [
  { key: "generalEmailsAccepted", label: "General Emails", description: "All account-related emails" },
  { key: "invoiceEmailsAccepted", label: "Invoice Emails", description: "Invoices, reminders & overdue notices" },
  { key: "supportEmailsAccepted", label: "Support Emails", description: "Support ticket communications" },
  { key: "productEmailsAccepted", label: "Product Emails", description: "Welcome, suspensions & lifecycle" },
  { key: "domainEmailsAccepted", label: "Domain Emails", description: "Registration & renewal notices" },
  { key: "affiliateEmailsAccepted", label: "Affiliate Emails", description: "Affiliate notifications" },
] as const;

const MARKETING_PREFS = [
  { key: "marketingEmailsAccepted", label: "Marketing Emails", description: "Promotional email communications" },
  { key: "smsMarketingAccepted", label: "SMS Marketing", description: "Promotional text messages (SMS)" },
] as const;

type UserExtras = {
  name?: string | null;
  generalEmailsAccepted?: boolean | null;
  invoiceEmailsAccepted?: boolean | null;
  supportEmailsAccepted?: boolean | null;
  productEmailsAccepted?: boolean | null;
  domainEmailsAccepted?: boolean | null;
  affiliateEmailsAccepted?: boolean | null;
  marketingEmailsAccepted?: boolean | null;
  smsMarketingAccepted?: boolean | null;
  adminNotes?: string | null;
  howDidYouFindUs?: string | null;
  acceptedTermsAndConditions?: boolean | null;
};

function pickExtraFields(source: UserExtras | undefined): UserExtras {
  if (!source) return {};
  return {
    name: source.name,
    generalEmailsAccepted: source.generalEmailsAccepted,
    invoiceEmailsAccepted: source.invoiceEmailsAccepted,
    supportEmailsAccepted: source.supportEmailsAccepted,
    productEmailsAccepted: source.productEmailsAccepted,
    domainEmailsAccepted: source.domainEmailsAccepted,
    affiliateEmailsAccepted: source.affiliateEmailsAccepted,
    marketingEmailsAccepted: source.marketingEmailsAccepted,
    smsMarketingAccepted: source.smsMarketingAccepted,
    adminNotes: source.adminNotes,
    howDidYouFindUs: source.howDidYouFindUs,
    acceptedTermsAndConditions: source.acceptedTermsAndConditions,
  };
}

export function ProfileInformation({ userId }: ProfileInformationProps) {
  const utils = trpc.useUtils();

  const { data: profile, isLoading: isLoadingProfile, error: profileError } =
    trpc.clients.getProfile.useQuery({ userId }, { enabled: !!userId });

  const { data: userRecord, isLoading: isLoadingUser, error: userError } =
    trpc.userProfile.getUserById.useQuery({ userId }, { enabled: !!userId });

  const cachedClient = utils.clients.getAll.getData()?.find((c) => c.id === userId);

  const isLoading = isLoadingProfile || isLoadingUser;
  const error = profileError ?? userError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive">{error.message || "Failed to load profile"}</p>
      </div>
    );
  }

  // getUserById (no fields) historically omitted preference/admin columns; merge list cache as fallback
  const user: UserExtras = {
    ...pickExtraFields(cachedClient as UserExtras | undefined),
    ...pickExtraFields(userRecord as UserExtras | undefined),
  };
  const displayName = user.name;

  const hasPersonal =
    displayName || profile?.firstName || profile?.lastName || profile?.phone;
  const hasAddress =
    profile?.address || profile?.city || profile?.state || profile?.country || profile?.postalCode;

  return (
    <div className="space-y-6">
      {hasPersonal && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {displayName && <InfoRow label="Display name" value={displayName} />}
            {profile?.firstName && <InfoRow label="First name" value={profile.firstName} />}
            {profile?.lastName && <InfoRow label="Last name" value={profile.lastName} />}
            {profile?.phone && (
              <InfoRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1.5 justify-end">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {profile.phone}
                  </span>
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {hasAddress && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {profile?.address && <InfoRow label="Street" value={profile.address} />}
            {profile?.city && <InfoRow label="City" value={profile.city} />}
            {profile?.state && <InfoRow label="State / Province" value={profile.state} />}
            {profile?.postalCode && <InfoRow label="Postal code" value={profile.postalCode} />}
            {profile?.country && <InfoRow label="Country" value={profile.country} />}
          </CardContent>
        </Card>
      )}

      {!hasPersonal && !hasAddress && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No contact or address details on file yet.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {EMAIL_PREFS.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <PrefBadge value={user?.[key as keyof UserExtras] as boolean | null | undefined} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Marketing Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MARKETING_PREFS.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  {key === "smsMarketingAccepted" && (
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <PrefBadge value={user?.[key as keyof UserExtras] as boolean | null | undefined} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Terms & Conditions
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Whether the client accepted terms and conditions
              </p>
            </div>
            <PrefBadge value={user?.acceptedTermsAndConditions} />
          </div>

          {user?.howDidYouFindUs ? (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-muted-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> How did they find us?
              </p>
              <p className="font-medium">{user.howDidYouFindUs}</p>
            </div>
          ) : (
            <InfoRow label="How did they find us?" value={<span className="text-muted-foreground">—</span>} />
          )}

          {user?.adminNotes ? (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-muted-foreground">Admin notes</p>
              <p className="leading-relaxed whitespace-pre-wrap font-medium">{user.adminNotes}</p>
            </div>
          ) : (
            <InfoRow label="Admin notes" value={<span className="text-muted-foreground">—</span>} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
