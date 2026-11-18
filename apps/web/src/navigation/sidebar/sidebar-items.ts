import { Icons } from "@/components/icons";
import {
  type LucideIcon,
} from "lucide-react";
import { type ComponentType } from "react";
import React from "react";

// Define the props that your custom icons accept (based on your SVGIconProps)
interface CustomIconProps {
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  viewBox?: string;
}

// Create a union type that accepts both Lucide icons and your custom icons
type IconComponent = LucideIcon | ComponentType<CustomIconProps>;

export interface NavSubItem {
  title: string;
  url: string;
  icon?: IconComponent;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  permissionKey?: string;
  permissionModule?: string;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: IconComponent;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  permissionKey?: string;
  permissionModule?: string;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Cloud Services",
    items: [
      {
        title: "Home",
        url: "/dashboard",
        icon: (props: any) => React.createElement(Icons.Home, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Domains",
        url: "/dashboard/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Get a Domain", url: "/dashboard/domains", permissionKey: "domains.search_register" },
          { title: "Transfer", url: "/dashboard/domain-transfer", permissionKey: "domains.transfer" },
          { title: "My Domains", url: "/dashboard/domains-portfolio", permissionKey: "domains.portfolio" },
        ],
      },
      {
        title: "Hosting",
        url: "/dashboard/hosting",
        icon: (props: any) => React.createElement(Icons.Hosting, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "hosting",
      },
      {
        title: "WordPress",
        url: "/dashboard/wordpress",
        icon: (props: any) => React.createElement(Icons.Wordpress, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "wordpress",
      },
      {
        title: "Emails",
        url: "/dashboard/emails",
        icon: (props: any) => React.createElement(Icons.Mail, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "emails",
      },
      {
        title: "Cloud Servers",
        url: "/dashboard/dedicated-servers",
        icon: (props: any) => React.createElement(Icons.DedicatedServers, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "VPS Hosting", url: "/dashboard/vps", permissionModule: "servers.vps" },
          { title: "VDS Hosting", url: "/dashboard/vds", permissionModule: "servers.vds" },
          { title: "Dedicated Servers", url: "/dashboard/dedicated-servers", permissionModule: "servers.dedicated" },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Digital Marketing",
    items: [
      // {
      //   title: "Nisc Social",
      //   url: "/dashboard/social-media",
      //   icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Facebook", url: "/dashboard/social-media/facebook", },
      //     // { title: "LinkedIn", url: "/dashboard/social-media-marketing/linkedin", },
      //   ],
      // },
      {
        title: "Social Media & Ads",
        url: "/dashboard/social-media-ads",
        icon: (props: any) => React.createElement(Icons.SOCIAL_MEDIA_ADS, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "social_ads",
        subItems: [
          { title: "Facebook", url: "/dashboard/social-media-ads/facebook", permissionKey: "social_ads.facebook" },
          { title: "Instagram", url: "/dashboard/social-media-ads/instagram", permissionKey: "social_ads.instagram" },
          { title: "LinkedIn", url: "/dashboard/social-media-ads/linkedin", permissionKey: "social_ads.linkedin" },
          { title: "Google Ads", url: "/dashboard/social-media-ads/google", permissionKey: "social_ads.google" },
        ],
      },
      {
        title: "Email Marketing",
        url: "/dashboard/nisc-email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Campaigns", url: "/dashboard/nisc-email-marketing/campaigns", permissionKey: "email_marketing.campaigns" },
          { title: "Audiences", url: "/dashboard/nisc-email-marketing/audiences", permissionKey: "email_marketing.audiences" },
          { title: "AI Email Builder", url: "/dashboard/nisc-email-builder", permissionKey: "email_marketing.email_builder" },
          { title: "Domains", url: "/dashboard/nisc-email-marketing/domain-configuration", permissionKey: "email_marketing.sending_domains" },
        ],
      },
      {
        title: "SEO",
        url: "/dashboard/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "SEO Reports", url: "/dashboard/seo-reports", permissionKey: "seo.reports" },
        ],
      },
      {
        title: "Creatives & Design",
        url: "/dashboard/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "creatives.assets",
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
      {
        title: "Zeepo AI",
        url: "/dashboard/zeepo-ai",
        icon: (props: any) => React.createElement(Icons.AISupport, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "gen_ai.zeepo_ai",
      },
    ],
  },
  {
    id: 4,
    label: "Billing",
    items: [
      {
        title: "Invoices",
        url: "/dashboard/invoices",
        icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "billing.invoices_view",
      },
      {
        title: "Subscriptions",
        url: "/dashboard/subscriptions",
        icon: (props: any) => React.createElement(Icons.Subscriptions, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "billing.subscriptions",
      },
    ],
  },
  {
    id: 5,
    label: "Account Settings",
    items: [
      {
        title: "My Profile",
        url: "/dashboard/my-profile",
        icon: (props: any) => React.createElement(Icons.User, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: (props: any) => React.createElement(Icons.Settings, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "Help Center",
      //   url: "/dashboard/help-center",
      //   icon: (props: any) => React.createElement(Icons.Help, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
    ],
  },
  {
    id: 6,
    label: "More Services",
    items: [
      {
        title: "Marketplace",
        url: "/dashboard/marketplace",
        icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "marketplace.browse",
      }
    ],
  },
];
export const agencysidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Cloud Services",
    items: [
      {
        title: "Home",
        url: "/hq/dashboard",
        icon: (props: any) => React.createElement(Icons.Home, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "dashboard.view",
      },
      {
        title: "Domains",
        url: "/hq/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "domains",
        subItems: [
          { title: "Registration", url: "/hq/domains", permissionKey: "domains.search_register" },
          { title: "TLDs", url: "/hq/tlds", permissionKey: "domains.tlds" },
          { title: "Transfer", url: "/hq/domain-transfer", permissionKey: "domains.transfer" },
          { title: "Domains Portfolio", url: "/hq/domains-portfolio", permissionKey: "domains.portfolio" },
          { title: "WHOIS Checker", url: "/hq/whois", permissionKey: "domains.whois" },
        ],
      },
      {
        title: "Hosting",
        url: "/hq/hosting",
        icon: (props: any) => React.createElement(Icons.Hosting, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "hosting.list",
      },
      {
        title: "Cloud Servers",
        url: "/hq/dedicated-servers",
        icon: (props: any) => React.createElement(Icons.DedicatedServers, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "VPS Hosting", url: "/hq/vps", permissionKey: "servers.vps.list" },
          { title: "VDS Hosting", url: "/hq/vds", permissionKey: "servers.vds.list" },
          { title: "Dedicated Servers", url: "/hq/dedicated-servers", permissionKey: "servers.dedicated.list" },
        ],
      },
      {
        title: "Cloud Storage",
        url: "/agency/cloud-storage",
        icon: (props: any) => React.createElement(Icons.CLOUD_STORAGE, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "storage.browse",
        isNew: true,
      },
      {
        title: "WordPress",
        url: "/hq/wordpress",
        icon: (props: any) => React.createElement(Icons.Wordpress, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "wordpress.list",
      },
      {
        title: "Backups & Restore",
        url: "/hq/backup-restore",
        icon: (props: any) => React.createElement(Icons.BACKUP, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "backup.list",
        subItems: [
          { title: "Nisc Backup", url: "/hq/backup-restore/nisc-backup", permissionKey: "backup.list" },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Digital Marketing",
    items: [
      // {
      //   title: "Nisc Social",
      //   url: "/hq/social-media-marketing",
      //   icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Facebook", url: "/hq/social-media-marketing/facebook", },
      //     { title: "Instagram", url: "/hq/social-media-marketing/instagram", },
      //     // { title: "Twitter", url: "/hq/social-media-marketing/twitter", },
      //     { title: "LinkedIn", url: "/hq/social-media-marketing/linkedin", },
      //     // { title: "TikTok", url: "/hq/social-media-marketing/tiktok", },
      //   ],
      // },
      {
        title: "Social Media & Ads",
        url: "/hq/social-media-ads",
        icon: (props: any) => React.createElement(Icons.SOCIAL_MEDIA_ADS, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "social",
        subItems: [
          { title: "Facebook", url: "/hq/social-media-ads/facebook", permissionModule: "social" },
          { title: "LinkedIn", url: "/hq/social-media-ads/linkedin", permissionModule: "social_linkedin" },
          { title: "Instagram", url: "/hq/social-media-ads/instagram", permissionModule: "social_instagram" },
          { title: "Google Ads", url: "/hq/social-media-ads/google", permissionModule: "social_google" },
        ],
      },
      {
        title: "Email Marketing",
        url: "/hq/nisc-email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "email_marketing",
        subItems: [
          { title: "Campaigns", url: "/hq/nisc-email-marketing/campaigns", permissionKey: "email_marketing.campaigns" },
          { title: "Audiences", url: "/hq/nisc-email-marketing/audiences", permissionKey: "email_marketing.audiences" },
          { title: "AI Email Builder", url: "/hq/nisc-email-builder", permissionKey: "email_marketing.email_builder" },
          { title: "Email Events", url: "/hq/nisc-email-marketing/email-events", permissionKey: "email_marketing.events" },
          { title: "Domains", url: "/hq/nisc-email-marketing/domain-configuration", permissionKey: "email_marketing.sending_domains" },
        ],
      },
      {
        title: "SEO",
        url: "/hq/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "seo",
        subItems: [
          { title: "Analytics", url: "/hq/seo-reports", permissionKey: "seo.reports" },
          { title: "SEO Suite", url: "/hq/seo-suite", permissionKey: "seo.suite" },
        ],
      },
      {
        title: "Creatives & Design",
        url: "/hq/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "creatives.assets",
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
      // {
      //   title: "Zeepo AI Agent",
      //   url: "/hq/zeepo-ai-agent",
      //   icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      {
        title: "Zeepo AI",
        url: "/hq/zeepo-ai",
        icon: (props: any) => React.createElement(Icons.AISupport, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "gen_ai.zeepo_ai",
        subItems: [
          { title: "Chat", url: "/hq/zeepo-ai", permissionKey: "gen_ai.zeepo_ai" },
          { title: "Activity", url: "/hq/zeepo-ai/activity", permissionKey: "gen_ai.zeepo_ai" },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Support",
    items: [
      {
        title: "Support & Help",
        url: "/hq/support",
        icon: (props: any) => React.createElement(Icons.LiveChat, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "support.tickets",
      },
    ],
  },
  {
    id: 5,
    label: "Management",
    items: [
      {
        title: "Products & Services",
        url: "/hq/nisc-services",
        icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "products.catalog",
      },
      {
        title: "Service Orders",
        url: "/hq/nisc-service-orders",
        icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "products.orders",
      },
      // {
      //   title: "Service Plans",
      //   url: "/hq/service-plans",
      //   icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      {
        title: "Clients",
        url: "/hq/clients",
        icon: (props: any) => React.createElement(Icons.Clients, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "clients.list",
        subItems: [
          { title: "Manage Clients", url: "/hq/clients", permissionKey: "clients.list" },
          { title: "Manage Organizations", url: "/hq/manage-organizations", permissionKey: "clients.organizations" },
          // { title: "Create Client", url: "/hq/clients", },
          // { title: "Manage Affiliates", url: "/hq/manage-affiliates", },
        ],
      },
      // {
      //   title: "Orders",
      //   url: "/hq/orders",
      //   icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Orders", url: "/hq/orders", },
      //     // { title: "Create Order", url: "/hq/orders", },
      //   ],
      // },
      {
        title: "Sales",
        url: "/hq/sales",
        icon: (props: any) => React.createElement(Icons.SALES, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "billing.quotations",
        subItems: [
          { title: "Quotations", url: "/hq/quotations", permissionKey: "billing.quotations" },
        ],
      },
      {
        title: "Billing",
        url: "/hq/billing",
        icon: (props: any) => React.createElement(Icons.Billing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "billing",
        subItems: [
          { title: "Transactions", url: "/hq/transactions", permissionKey: "billing.transactions" },
          { title: "Invoices", url: "/hq/invoices", permissionKey: "billing.invoices" },
          { title: "Subscriptions", url: "/hq/subscriptions", permissionKey: "billing.subscriptions" },
        ],
      },
      {
        title: "Payment Gateway",
        url: "/hq/nisc-payment-gateway",
        icon: (props: any) => React.createElement(Icons.PAYMENT_GATEWAY, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        isNew: true,
        permissionKey: "payments.gateway",
      },
      // {
      //   title: "Digitax eTIMS",
      //   url: "/hq/digitax/sales",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Sales", url: "/hq/digitax/sales", },
      //     { title: "Purchases", url: "/hq/digitax/purchases", },
      //     { title: "Products", url: "/hq/digitax/products", },
      //     { title: "Customers", url: "/hq/digitax/customers", },
      //     { title: "Branches", url: "/hq/digitax/branches", },
      //     { title: "Notices", url: "/hq/digitax/notices", },
      //     { title: "Verifications", url: "/hq/digitax/verifications", },
      //   ],
      // },
      {
        title: "KRA eTIMS",
        url: "/hq/kra-etims/sales",
        icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "etims",
        subItems: [
          { title: "Sales", url: "/hq/kra-etims/sales", permissionKey: "etims.sales" },
          { title: "Purchases", url: "/hq/kra-etims/purchases", permissionKey: "etims.purchases" },
          { title: "Products", url: "/hq/kra-etims/products", permissionKey: "etims.products" },
          { title: "Stock taking", url: "/hq/kra-etims/stock", permissionKey: "etims.stock" },
          { title: "Imports", url: "/hq/kra-etims/imports", permissionKey: "etims.imports" },
          { title: "Customers", url: "/hq/kra-etims/customers", permissionKey: "etims.customers" },
          { title: "Branches", url: "/hq/kra-etims/branches", permissionKey: "etims.branches" },
          { title: "Codes", url: "/hq/kra-etims/codes", permissionKey: "etims.codes" },
          { title: "Notices", url: "/hq/kra-etims/notices", permissionKey: "etims.notices" },
          { title: "Settings", url: "/hq/kra-etims/settings", permissionKey: "etims.settings" },
        ],
      },
      // {
      //   title: "Reports",
      //   url: "/hq/reports/sales",
      //   icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Sales Reports", url: "/hq/reports/sales", },
      //     { title: "Creative Reports", url: "/hq/reports/creative", },
      //   ],
      // },
      {
        title: "Reporting",
        url: "/hq/nisc-reports",
        icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "reports",
      },
      // {
      //   title: "Workflow Jobs",
      //   url: "/hq/cronjobs",
      //   icon: (props: any) => React.createElement(Icons.CRONJOB, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Invoicing",
      //   url: "/hq/invoicing",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Reports",
      //   url: "/hq/reports",
      //   icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Customer Reports", url: "/hq/reports", },
      //     { title: "Order Reports", url: "/hq/reports", },
      //     { title: "Transaction Reports", url: "/hq/reports", },
      //   ],
      // },
    ],
  },
  {
    id: 6,
    label: "CRM",
    items: [
      {
        title: "CRM",
        url: "/hq/crm/contacts",
        icon: (props: any) => React.createElement(Icons.Clients, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "crm",
        subItems: [
          { title: "Contacts", url: "/hq/crm/contacts", permissionKey: "crm.contacts" },
          { title: "Deals", url: "/hq/crm/deals", permissionKey: "crm.deals" },
        ],
      },
    ],
  },
  {
    id: 7,
    label: "Human resource",
    items: [
      {
        title: "Human resource",
        url: "/hq/hr/roles",
        icon: (props: any) => React.createElement(Icons.User, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "hr",
        subItems: [
          { title: "Open roles", url: "/hq/hr/roles", permissionKey: "hr.openings" },
          { title: "Applications", url: "/hq/hr/applications", permissionKey: "hr.applications" },
        ],
      },
    ],
  },
];
