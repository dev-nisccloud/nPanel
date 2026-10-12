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
        title: "Media Buying",
        url: "/dashboard/ad-campaigns",
        icon: (props: any) => React.createElement(Icons.Campaigns, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Meta Ads", url: "/dashboard/ad-campaigns/meta-ads", permissionModule: "ads.meta" },
          { title: "Google Ads", url: "/dashboard/ad-campaigns/google-ads", permissionModule: "ads.google" },
          { title: "LinkedIn Ads", url: "/dashboard/ad-campaigns/linkedin-ads", permissionModule: "ads.linkedin" },
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
        url: "/agency/dashboard",
        icon: (props: any) => React.createElement(Icons.Home, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "dashboard.view",
      },
      {
        title: "Domains",
        url: "/agency/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "domains",
        subItems: [
          { title: "Registration", url: "/agency/domains", permissionKey: "domains.search_register" },
          { title: "TLDs", url: "/agency/tlds", permissionKey: "domains.tlds" },
          { title: "Transfer", url: "/agency/domain-transfer", permissionKey: "domains.transfer" },
          { title: "Domains Portfolio", url: "/agency/domains-portfolio", permissionKey: "domains.portfolio" },
          { title: "WHOIS Checker", url: "/agency/whois", permissionKey: "domains.whois" },
        ],
      },
      {
        title: "Hosting",
        url: "/agency/hosting",
        icon: (props: any) => React.createElement(Icons.Hosting, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "hosting.list",
      },
      {
        title: "Cloud Servers",
        url: "/agency/dedicated-servers",
        icon: (props: any) => React.createElement(Icons.DedicatedServers, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "VPS Hosting", url: "/agency/vps", permissionKey: "servers.vps.list" },
          { title: "VDS Hosting", url: "/agency/vds", permissionKey: "servers.vds.list" },
          { title: "Dedicated Servers", url: "/agency/dedicated-servers", permissionKey: "servers.dedicated.list" },
        ],
      },
      {
        title: "WordPress",
        url: "/agency/wordpress",
        icon: (props: any) => React.createElement(Icons.Wordpress, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "wordpress.list",
      },
      {
        title: "Backups & Restore",
        url: "/agency/backup-restore",
        icon: (props: any) => React.createElement(Icons.BACKUP, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "backup.list",
        subItems: [
          { title: "Nisc Backup", url: "/agency/backup-restore/nisc-backup", permissionKey: "backup.list" },
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
      //   url: "/agency/social-media-marketing",
      //   icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Facebook", url: "/agency/social-media-marketing/facebook", },
      //     { title: "Instagram", url: "/agency/social-media-marketing/instagram", },
      //     // { title: "Twitter", url: "/agency/social-media-marketing/twitter", },
      //     { title: "LinkedIn", url: "/agency/social-media-marketing/linkedin", },
      //     // { title: "TikTok", url: "/agency/social-media-marketing/tiktok", },
      //   ],
      // },
      {
        title: "Media Buying",
        url: "/agency/ad-campaigns",
        icon: (props: any) => React.createElement(Icons.Campaigns, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Facebook Ads", url: "/agency/ad-campaigns/meta-ads", permissionModule: "ads.meta" },
          // { title: "Instagram Ads", url: "/agency/ad-campaigns/instagram-ads", },
          { title: "Google Ads", url: "/agency/ad-campaigns/google-ads", permissionModule: "ads.google" },
          { title: "LinkedIn Ads", url: "/agency/ad-campaigns/linkedin-ads", permissionModule: "ads.linkedin" },
        ],
      },
      {
        title: "Social Media & Ads",
        url: "/agency/social-media-ads",
        icon: (props: any) => React.createElement(Icons.SOCIAL_MEDIA_ADS, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "social",
        subItems: [
          { title: "Facebook", url: "/agency/social-media-ads/facebook", permissionModule: "social" },
        ],
      },
      {
        title: "Email Marketing",
        url: "/agency/nisc-email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "email_marketing",
        subItems: [
          { title: "Campaigns", url: "/agency/nisc-email-marketing/campaigns", permissionKey: "email_marketing.campaigns" },
          { title: "Audiences", url: "/agency/nisc-email-marketing/audiences", permissionKey: "email_marketing.audiences" },
          { title: "AI Email Builder", url: "/agency/nisc-email-builder", permissionKey: "email_marketing.email_builder" },
          { title: "Email Events", url: "/agency/nisc-email-marketing/email-events", permissionKey: "email_marketing.events" },
          { title: "Domains", url: "/agency/nisc-email-marketing/domain-configuration", permissionKey: "email_marketing.sending_domains" },
        ],
      },
      {
        title: "SEO",
        url: "/agency/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "seo",
        subItems: [
          { title: "Analytics", url: "/agency/seo-reports", permissionKey: "seo.reports" },
          { title: "SEO Suite", url: "/agency/seo-suite", permissionKey: "seo.suite" },
        ],
      },
      {
        title: "Creatives & Design",
        url: "/agency/creative-assets",
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
      //   url: "/agency/zeepo-ai-agent",
      //   icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      {
        title: "Zeepo AI",
        url: "/agency/zeepo-ai",
        icon: (props: any) => React.createElement(Icons.AISupport, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "gen_ai.zeepo_ai",
        subItems: [
          { title: "Chat", url: "/agency/zeepo-ai", permissionKey: "gen_ai.zeepo_ai" },
          { title: "Activity", url: "/agency/zeepo-ai/activity", permissionKey: "gen_ai.zeepo_ai" },
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
        url: "/agency/support",
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
        url: "/agency/nisc-services",
        icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "products.catalog",
      },
      {
        title: "Service Orders",
        url: "/agency/nisc-service-orders",
        icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "products.orders",
      },
      // {
      //   title: "Service Plans",
      //   url: "/agency/service-plans",
      //   icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      {
        title: "Clients",
        url: "/agency/clients",
        icon: (props: any) => React.createElement(Icons.Clients, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "clients.list",
        subItems: [
          { title: "Manage Clients", url: "/agency/clients", permissionKey: "clients.list" },
          { title: "Manage Organizations", url: "/agency/manage-organizations", permissionKey: "clients.organizations" },
          // { title: "Create Client", url: "/agency/clients", },
          // { title: "Manage Affiliates", url: "/agency/manage-affiliates", },
        ],
      },
      // {
      //   title: "Orders",
      //   url: "/agency/orders",
      //   icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Orders", url: "/agency/orders", },
      //     // { title: "Create Order", url: "/agency/orders", },
      //   ],
      // },
      {
        title: "Sales",
        url: "/agency/sales",
        icon: (props: any) => React.createElement(Icons.SALES, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionKey: "billing.quotations",
        subItems: [
          { title: "Quotations", url: "/agency/quotations", permissionKey: "billing.quotations" },
        ],
      },
      {
        title: "Billing",
        url: "/agency/billing",
        icon: (props: any) => React.createElement(Icons.Billing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "billing",
        subItems: [
          { title: "Transactions", url: "/agency/transactions", permissionKey: "billing.transactions" },
          { title: "Invoices", url: "/agency/invoices", permissionKey: "billing.invoices" },
          { title: "Subscriptions", url: "/agency/subscriptions", permissionKey: "billing.subscriptions" },
        ],
      },
      {
        title: "Payment Gateway",
        url: "/agency/nisc-payment-gateway",
        icon: (props: any) => React.createElement(Icons.PAYMENT_GATEWAY, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        isNew: true,
        permissionKey: "payments.gateway",
      },
      // {
      //   title: "Digitax eTIMS",
      //   url: "/agency/digitax/sales",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Sales", url: "/agency/digitax/sales", },
      //     { title: "Purchases", url: "/agency/digitax/purchases", },
      //     { title: "Products", url: "/agency/digitax/products", },
      //     { title: "Customers", url: "/agency/digitax/customers", },
      //     { title: "Branches", url: "/agency/digitax/branches", },
      //     { title: "Notices", url: "/agency/digitax/notices", },
      //     { title: "Verifications", url: "/agency/digitax/verifications", },
      //   ],
      // },
      {
        title: "KRA eTIMS",
        url: "/agency/kra-etims/sales",
        icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "etims",
        subItems: [
          { title: "Sales", url: "/agency/kra-etims/sales", permissionKey: "etims.sales" },
          { title: "Purchases", url: "/agency/kra-etims/purchases", permissionKey: "etims.purchases" },
          { title: "Products", url: "/agency/kra-etims/products", permissionKey: "etims.products" },
          { title: "Stock taking", url: "/agency/kra-etims/stock", permissionKey: "etims.stock" },
          { title: "Imports", url: "/agency/kra-etims/imports", permissionKey: "etims.imports" },
          { title: "Customers", url: "/agency/kra-etims/customers", permissionKey: "etims.customers" },
          { title: "Branches", url: "/agency/kra-etims/branches", permissionKey: "etims.branches" },
          { title: "Codes", url: "/agency/kra-etims/codes", permissionKey: "etims.codes" },
          { title: "Notices", url: "/agency/kra-etims/notices", permissionKey: "etims.notices" },
          { title: "Settings", url: "/agency/kra-etims/settings", permissionKey: "etims.settings" },
        ],
      },
      // {
      //   title: "Reports",
      //   url: "/agency/reports/sales",
      //   icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Sales Reports", url: "/agency/reports/sales", },
      //     { title: "Creative Reports", url: "/agency/reports/creative", },
      //   ],
      // },
      {
        title: "Reporting",
        url: "/agency/nisc-reports",
        icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "reports",
      },
      // {
      //   title: "Workflow Jobs",
      //   url: "/agency/cronjobs",
      //   icon: (props: any) => React.createElement(Icons.CRONJOB, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Invoicing",
      //   url: "/agency/invoicing",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Reports",
      //   url: "/agency/reports",
      //   icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Customer Reports", url: "/agency/reports", },
      //     { title: "Order Reports", url: "/agency/reports", },
      //     { title: "Transaction Reports", url: "/agency/reports", },
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
        url: "/agency/crm/contacts",
        icon: (props: any) => React.createElement(Icons.Clients, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        permissionModule: "crm",
        subItems: [
          { title: "Contacts", url: "/agency/crm/contacts", permissionKey: "crm.contacts" },
          { title: "Deals", url: "/agency/crm/deals", permissionKey: "crm.deals" },
        ],
      },
    ],
  },
];
