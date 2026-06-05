"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Facebook,
  Instagram,
  Chrome,
  Linkedin,
  CheckCircle2,
  ExternalLink,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type AdPlatform = "meta" | "google" | "linkedin";

interface PlatformGuide {
  title: string;
  description: string;
  niscContact: string;
  niscContactLabel: string;
  accessUrl: string;
  accessUrlLabel: string;
  steps: {
    heading: string;
    instructions: string[];
    note?: string;
  }[];
  importantNote?: string;
}

const GUIDES: Record<AdPlatform, PlatformGuide> = {
  meta: {
    title: "Facebook & Instagram Ads Access",
    description:
      "Follow these steps to add Nisc Cloud as an admin to your Meta Business Suite so we can manage and report on your campaigns.",
    niscContact: "ads@nisccloud.com",
    niscContactLabel: "Nisc Cloud Ads Email",
    accessUrl: "https://business.facebook.com/settings/people",
    accessUrlLabel: "Open Meta Business Settings",
    steps: [
      {
        heading: "Open Meta Business Settings",
        instructions: [
          'Go to business.facebook.com and sign in with your Facebook account.',
          'Click the hamburger menu (≡) at the top left corner.',
          'Select "Business Settings" from the menu.',
        ],
      },
      {
        heading: "Navigate to People",
        instructions: [
          'In the left sidebar, under the "Users" section, click "People".',
          'You will see a list of everyone who has access to your Business Manager.',
        ],
      },
      {
        heading: "Add Nisc Cloud as Admin",
        instructions: [
          'Click the "+ Add" button at the top of the People list.',
          'Enter the Nisc Cloud email address: ads@nisccloud.com',
          'Switch "Admin access" to On.',
          'Click "Next".',
        ],
        note:
          "Admin access gives Nisc Cloud full visibility into your ad account, pages, and pixels  required for accurate reporting.",
      },
      {
        heading: "Assign Business Assets",
        instructions: [
          "On the next screen, select the ad accounts, Pages, and Pixels you want Nisc Cloud to manage.",
          'Set each asset to "Full Control" or "Manage".',
          'Click "Invite" to send the invitation.',
        ],
      },
      {
        heading: "Confirm the Invitation",
        instructions: [
          "Nisc Cloud will receive an invitation email and accept it.",
          "Once accepted, Nisc Cloud can connect to your account and begin pulling campaign data.",
          "You will start seeing your ad analytics here within 24 hours.",
        ],
      },
    ],
    importantNote:
      "You must be an existing Admin of your Meta Business Manager to add new admins. If you are not an admin, please ask your company's Business Manager admin to complete these steps.",
  },

  google: {
    title: "Google Ads Access",
    description:
      "Share access to your Google Ads account so Nisc Cloud can manage campaigns and pull performance data on your behalf.",
    niscContact: "nisccloudmarketing@gmail.com",
    niscContactLabel: "Nisc Cloud Google Account Email",
    accessUrl: "https://ads.google.com/",
    accessUrlLabel: "Open Google Ads",
    steps: [
      {
        heading: "Find Your Google Ads Customer ID",
        instructions: [
          "Log in to your Google Ads account at ads.google.com.",
          "In the top-left corner, next to your account name, you'll find a 10-digit code formatted as XXX-XXX-XXXX.",
          "Copy this Customer ID  share it with your Nisc Cloud account manager so they can send you an access request.",
        ],
        note:
          "The Customer ID is not sensitive and is safe to share with your agency.",
      },
      {
        heading: "Open Access & Security Settings",
        instructions: [
          'Click "Admin" at the bottom of the left-hand navigation menu.',
          'Select "Access and security".',
        ],
      },
      {
        heading: "Add Nisc Cloud as a User",
        instructions: [
          'Click the "+" (plus) icon above the existing users list.',
          'Enter the Nisc Cloud email: nisccloudmarketing@gmail.com',
          'Set the access level to "Standard"  this allows Nisc Cloud to manage campaigns without touching billing details.',
          'Click "Send invitation".',
        ],
        note:
          "Standard access is the recommended level for agencies. It allows full campaign management but does not expose payment methods.",
      },
      {
        heading: "Accept the Manager Account Request (Alternative)",
        instructions: [
          "If Nisc Cloud sends a Manager Account (MCC) link request instead, you will receive an email notification.",
          'In Access and Security, click the "Managers" tab.',
          "You will see a pending access request from Nisc Cloud  verify the name and click Approve.",
        ],
      },
      {
        heading: "Done!",
        instructions: [
          "Once the invitation is accepted, Nisc Cloud will be able to view and manage your Google Ads campaigns.",
          "Your campaign data will appear here within 24 hours of granting access.",
        ],
      },
    ],
    importantNote:
      "You must have Admin access to your Google Ads account to invite new users. If you only have Standard access, ask your account owner to complete these steps.",
  },

  linkedin: {
    title: "LinkedIn Campaign Manager Access",
    description:
      "Add Nisc Cloud as an Account Manager in your LinkedIn Campaign Manager so we can view and report on your ad performance.",
    niscContact: "linkedin.com/in/nisc-ads",
    niscContactLabel: "Nisc Cloud LinkedIn Profile",
    accessUrl: "https://www.linkedin.com/campaignmanager/",
    accessUrlLabel: "Open LinkedIn Campaign Manager",
    steps: [
      {
        heading: "Connect with Nisc Cloud on LinkedIn",
        instructions: [
          "Before you can add someone to your Campaign Manager, they must be at least a 1st, 2nd, or 3rd-degree LinkedIn connection.",
          "Send a connection request to the Nisc Cloud LinkedIn profile (provided by your account manager) if you have not already.",
        ],
        note:
          "This is a LinkedIn requirement  users can only be added if they are in your network.",
      },
      {
        heading: "Open Campaign Manager",
        instructions: [
          "Go to linkedin.com/campaignmanager and sign in.",
          "Select the correct ad account from the dropdown at the top.",
        ],
      },
      {
        heading: "Go to Manage Access",
        instructions: [
          'In the left sidebar, click "Account Settings".',
          'Select "Manage access" from the dropdown.',
        ],
      },
      {
        heading: "Add Nisc Cloud as Account Manager",
        instructions: [
          'Click the "Add user" button at the top of the page.',
          "Search for the Nisc Cloud team member by name or paste their LinkedIn Profile URL.",
          'Select their profile from the dropdown.',
          'Set the role to "Account Manager"  this gives full campaign management access.',
          'Click "Add".',
        ],
      },
      {
        heading: "Grant LinkedIn Page Access (for Sponsored Content)",
        instructions: [
          "If you run Sponsored Content ads, Nisc Cloud also needs Page admin access.",
          "Navigate to your LinkedIn Company Page.",
          'Click "Settings" in the left sidebar, then "Manage admins".',
          'Click the "Paid media admins" tab.',
          'Click "+ Add paid media admin" and search for the Nisc Cloud team member.',
          'Assign "Sponsored content poster" permission (minimum required) and click Save.',
        ],
        note:
          "This step is only required if your campaigns include Sponsored Content (promoted posts).",
      },
      {
        heading: "Done!",
        instructions: [
          "Nisc Cloud now has access to view and manage your LinkedIn campaigns.",
          "Your campaign analytics will appear here within 24 hours.",
        ],
      },
    ],
    importantNote:
      "You must be an Account Manager or Billing Admin of the LinkedIn ad account to add new users. Contact your account owner if you don't have this permission.",
  },
};

const PLATFORM_ICONS: Record<AdPlatform, React.ReactNode> = {
  meta: (
    <div className="flex items-center gap-1.5">
      <Facebook className="w-4 h-4 text-blue-500" />
      <Instagram className="w-4 h-4 text-pink-500" />
    </div>
  ),
  google: <Chrome className="w-4 h-4 text-yellow-500" />,
  linkedin: <Linkedin className="w-4 h-4 text-blue-600" />,
};

interface AdminAccessGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: AdPlatform;
  selectedPlanName?: string;
  selectedCommissionRate?: number | null;
}

export function AdminAccessGuideDialog({
  open,
  onOpenChange,
  platform,
  selectedPlanName,
  selectedCommissionRate,
}: AdminAccessGuideDialogProps) {
  const guide = GUIDES[platform];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-4xl lg:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {PLATFORM_ICONS[platform]}
            <DialogTitle className="text-lg">{guide.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {guide.description}
          </DialogDescription>
          {selectedPlanName && (
            <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
              Selected plan:{" "}
              <span className="font-semibold text-foreground">{selectedPlanName}</span>
              {selectedCommissionRate != null && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-foreground">
                    {selectedCommissionRate}% of ad spend
                  </span>
                </>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Nisc Cloud Contact + Quick Link */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 flex-1">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {guide.niscContactLabel}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {guide.niscContact}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 self-center" asChild>
              <a href={guide.accessUrl} target="_blank" rel="noopener noreferrer">
                {guide.accessUrlLabel}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>

          {/* Important note */}
          {guide.importantNote && (
            <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                {guide.importantNote}
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            {guide.steps.map((step, idx) => (
              <div
                key={step.heading}
                className={cn(
                  "rounded-xl border border-border/60 bg-card/40 p-4",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      {step.heading}
                    </p>
                    <ul className="space-y-1.5">
                      {step.instructions.map((instruction, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground leading-snug">
                            {instruction}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {step.note && (
                      <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Once you have completed these steps, reach out to your Nisc Cloud account manager to confirm access has been granted. Your campaign data will become visible here within 24 hours.
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              Need help? Contact us at{" "}
              <a href="tel:+254748777666" className="underline underline-offset-2">
                +254 748 777 666
              </a>
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
