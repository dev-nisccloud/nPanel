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
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: IconComponent;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
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
          { title: "Get a Domain", url: "/dashboard/domains", },
          { title: "Transfer", url: "/dashboard/domain-transfer", },
          { title: "My Domains", url: "/dashboard/domains-portfolio", },
        ],
      },
      {
        title: "Hosting",
        url: "/dashboard/hosting",
        icon: (props: any) => React.createElement(Icons.Hosting, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Emails",
        url: "/dashboard/emails",
        icon: (props: any) => React.createElement(Icons.Mail, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Cloud Servers",
        url: "/dashboard/dedicated-servers",
        icon: (props: any) => React.createElement(Icons.DedicatedServers, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "VPS Hosting", url: "/dashboard/vps", },
          { title: "VDS Hosting", url: "/dashboard/vds", },
          { title: "Dedicated Servers", url: "/dashboard/dedicated-servers", },
        ],
      },
      // {
      //   title: "Files",
      //   url: "/dashboard/files",
      //   icon: (props: any) => React.createElement(Icons.File, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Databases",
      //   url: "/dashboard/databases",
      //   icon: (props: any) => React.createElement(Icons.Database, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Security",
      //   url: "/dashboard/security",
      //   icon: (props: any) => React.createElement(Icons.Security, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
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
          { title: "Meta Ads", url: "/dashboard/ad-campaigns/meta-ads", },
          { title: "Google Ads", url: "/dashboard/ad-campaigns/google-ads", },
          { title: "LinkedIn Ads", url: "/dashboard/ad-campaigns/linkedin-ads", },
        ],
      },
      {
        title: "Nisc Email Marketing",
        url: "/dashboard/nisc-email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Campaigns", url: "/dashboard/nisc-email-marketing/campaigns", },
          { title: "Audiences", url: "/dashboard/nisc-email-marketing/audiences", },
          { title: "Domains", url: "/dashboard/nisc-email-marketing/domain-configuration", },
        ],
      },
      {
        title: "SEO",
        url: "/dashboard/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "SEO Reports", url: "/dashboard/seo-reports", },
        ],
      },
      {
        title: "Creatives & Design",
        url: "/dashboard/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
      {
        title: "Zeepo AI Canvas",
        url: "/dashboard/zeepo-canvas",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
      },
      {
        title: "Subscriptions",
        url: "/dashboard/subscriptions",
        icon: (props: any) => React.createElement(Icons.Subscriptions, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
      },
      {
        title: "Domains",
        url: "/agency/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Registration", url: "/agency/domains", },
          { title: "TLDs", url: "/agency/tlds", },
          { title: "Transfer", url: "/agency/domain-transfer", },
          { title: "Domains Portfolio", url: "/agency/domains-portfolio", },
        ],
      },
      {
        title: "Hosting",
        url: "/agency/hosting",
        icon: (props: any) => React.createElement(Icons.Hosting, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Cloud Servers",
        url: "/agency/dedicated-servers",
        icon: (props: any) => React.createElement(Icons.DedicatedServers, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "VPS Hosting", url: "/agency/vps", },
          { title: "VDS Hosting", url: "/agency/vds", },
          { title: "Dedicated Servers", url: "/agency/dedicated-servers", },
        ],
      },
      // {
      //   title: "Dedicated Servers",
      //   url: "/agency/dedicated-servers",
      //   icon: (props: any) => React.createElement(Icons.DedicatedServers, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "VPS & VDS",
      //   url: "/agency/vps",
      //   icon: (props: any) => React.createElement(Icons.VPS, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "VPS Hosting", url: "/agency/vps", },
      //     { title: "VDS Hosting", url: "/agency/vds", },
      //   ],
      // },
      {
        title: "WordPress",
        url: "/agency/wordpress",
        icon: (props: any) => React.createElement(Icons.Wordpress, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "Backups & Restore",
      //   url: "/agency/backup-restore",
      //   icon: (props: any) => React.createElement(Icons.Wordpress, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "JetBackup 5", url: "/agency/backup-restore/jetbackup5", },
      //   ],
      // },
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
          { title: "Facebook Ads", url: "/agency/ad-campaigns/meta-ads", },
          // { title: "Instagram Ads", url: "/agency/ad-campaigns/instagram-ads", },
          { title: "Google Ads", url: "/agency/ad-campaigns/google-ads", },
          { title: "LinkedIn Ads", url: "/agency/ad-campaigns/linkedin-ads", },
        ],
      },
      {
        title: "Email Marketing",
        url: "/agency/nisc-email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Campaigns", url: "/agency/nisc-email-marketing/campaigns", },
          { title: "Audiences", url: "/agency/nisc-email-marketing/audiences", },
          { title: "AI Email Builder", url: "/agency/nisc-email-builder", },
          { title: "Email Events", url: "/agency/nisc-email-marketing/email-events", },
          { title: "Domains", url: "/agency/nisc-email-marketing/domain-configuration", },
        ],
      },
      // {
      //   title: "Nisc Email Builder",
      //   url: "/agency/nisc-email-builder",
      //   icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Email Marketing",
      //   url: "/agency/email-marketing",
      //   icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     // { title: "Metrics", url: "/agency/email-marketing/metrics", },
      //     { title: "Campaigns", url: "/agency/email-marketing/campaigns", },
      //     // { title: "Emails", url: "/agency/email-marketing/emails", },
      //     { title: "Domains", url: "/agency/email-marketing/domain-configuration", },
      //     { title: "Audiences", url: "/agency/email-marketing/audiences", },
      //     // { title: "Segments", url: "/agency/segments", },
      //     // { title: "Templates", url: "/agency/email-marketing/templates", },
      //     { title: "Email Builder", url: "/agency/email-marketing/email-builder", },
      //   ],
      // },
      {
        title: "SEO",
        url: "/agency/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "SEO Reports", url: "/agency/seo-reports", },
          // { title: "Google Analytics", url: "/agency/google-analytics", },
        ],
      },
      {
        title: "Creatives & Design",
        url: "/agency/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
      // {
      //   title: "Zeepo AI Canvas",
      //   url: "/agency/zeepo-canvas",
      //   icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      {
        title: "Zeepo AI Agent",
        url: "/agency/zeepo-ai-agent",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "Visual Studio",
      //   url: "/agency/gen-ai/image-gen-studio",
      //   icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Image Generator",
      //   url: "/agency/gen-ai/image-generator",
      //   icon: (props: any) => React.createElement(Icons.AIImage, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Background Remover",
      //   url: "/agency/gen-ai/background-remover",
      //   icon: (props: any) => React.createElement(Icons.BackgroundRemover, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "AI Image Editor",
      //   url: "/agency/gen-ai/ai-image-editor",
      //   icon: (props: any) => React.createElement(Icons.BackgroundRemover, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
    ],
  },
  {
    id: 4,
    label: "Management",
    items: [
      {
        title: "Products & Services",
        url: "/agency/nisc-services",
        icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Service Orders",
        url: "/agency/nisc-service-orders",
        icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
        subItems: [
          { title: "Manage Clients", url: "/agency/clients", },
          { title: "Manage Organizations", url: "/agency/manage-teams", },
          // { title: "Create Client", url: "/agency/clients", },
          { title: "Manage Users", url: "/agency/manage-users", },
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
        title: "Billing",
        url: "/agency/billing",
        icon: (props: any) => React.createElement(Icons.Billing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Transactions", url: "/agency/transactions", },
          { title: "Invoices", url: "/agency/invoices", },
          { title: "Subscriptions", url: "/agency/subscriptions", },
          { title: "Quotations", url: "/agency/quotations", },
        ],
      },
      // {
      //   title: "eTIMS Compliance",
      //   url: "/agency/digitax/sales",
      //   icon: (props: any) => React.createElement(Icons.DIGITAX, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
        subItems: [
          { title: "Sales", url: "/agency/kra-etims/sales", },
          { title: "Purchases", url: "/agency/kra-etims/purchases", },
          { title: "Products", url: "/agency/kra-etims/products", },
          { title: "Customers", url: "/agency/kra-etims/customers", },
          { title: "Branches", url: "/agency/kra-etims/branches", },
          { title: "Settings", url: "/agency/kra-etims/settings", },
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
      },
      {
        title: "Workflow Jobs",
        url: "/agency/cronjobs",
        icon: (props: any) => React.createElement(Icons.CRONJOB, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "Invoicing",
      //   url: "/agency/invoicing",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Support",
      //   url: "/agency/support",
      //   icon: (props: any) => React.createElement(Icons.Help, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Tickets", url: "/agency/support", },
      //     { title: "Knowledge Base", url: "/agency/support", },
      //     { title: "AI Assistant", url: "/agency/support", },
      //   ],
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
];
