import { Mail, Server, Zap } from "lucide-react";
import {
  fetchEmailHostingPlansPublic,
  fetchSharedHostingPlansPublic,
  fetchWordPressHostingPlansPublic,
} from "@/lib/vps-plans-api.ts";
import type { HostingPlansPricingConfig } from "./HostingPlansPricingSection.tsx";

export const SHARED_HOSTING_PRICING_CONFIG: HostingPlansPricingConfig = {
  sectionId: "plans",
  title: "Choose Your Hosting Plan",
  description:
    "Fast, reliable shared hosting with NVMe SSD servers, free SSL, cPanel, and daily backups.",
  serviceType: "web_hosting",
  fetchPlans: fetchSharedHostingPlansPublic,
  planIcon: Server,
  highlightBadge: "NVMe SSD",
  fallbackFeatures: [
    {
      label: "Websites",
      value: "Multiple sites supported",
      description: "The number of separate websites you can host on this plan.",
    },
    {
      label: "SSL",
      value: "Free SSL included",
      description: "Free SSL certificate automatically installed and renewed for your domains.",
    },
    {
      label: "Backups",
      value: "Daily automated backups",
      description: "Automated daily backups with one-click restore from cPanel.",
    },
  ],
};

export const WORDPRESS_HOSTING_PRICING_CONFIG: HostingPlansPricingConfig = {
  sectionId: "plans",
  title: "Choose Your WordPress Plan",
  description:
    "WordPress-optimised hosting with LiteSpeed cache, staging environments, auto-updates, and free SSL.",
  serviceType: "wordpress_hosting",
  fetchPlans: fetchWordPressHostingPlansPublic,
  planIcon: Zap,
  highlightBadge: "WP Optimised",
  fallbackFeatures: [
    {
      label: "WordPress Sites",
      value: "Multiple installs supported",
      description: "The number of WordPress websites you can run on this plan.",
    },
    {
      label: "LiteSpeed Cache",
      value: "Built-in caching",
      description: "Server-level caching tuned for faster WordPress page loads.",
    },
    {
      label: "Staging",
      value: "One-click staging",
      description: "Test updates safely before pushing changes to your live site.",
    },
    {
      label: "Auto Updates",
      value: "Core & plugin updates",
      description: "Automatic WordPress core and plugin updates with rollback support.",
    },
  ],
};

export const EMAIL_HOSTING_PRICING_CONFIG: HostingPlansPricingConfig = {
  sectionId: "plans",
  title: "Choose Your Business Email Plan",
  description:
    "Professional email on your domain with DKIM, SPF, webmail, and mobile sync — hosted in Nairobi.",
  serviceType: "email_hosting",
  fetchPlans: fetchEmailHostingPlansPublic,
  planIcon: Mail,
  highlightBadge: "DKIM Ready",
  fallbackFeatures: [
    {
      label: "Mailboxes",
      value: "Professional addresses",
      description: "Create branded email addresses like you@yourbusiness.co.ke.",
    },
    {
      label: "Storage",
      value: "Generous mailbox storage",
      description: "Mailbox storage per account for attachments and archived mail.",
    },
    {
      label: "Email Security",
      value: "DKIM, SPF & DMARC",
      description: "Authentication records to improve deliverability and reduce spoofing.",
    },
    {
      label: "Webmail",
      value: "Access anywhere",
      description: "Use webmail or connect Outlook, Apple Mail, and mobile apps via IMAP/SMTP.",
    },
  ],
};
