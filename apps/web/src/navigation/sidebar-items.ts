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
        url: "/dashboard/dashboard",
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
      {
        title: "Nisc Social",
        url: "/dashboard/social-media",
        icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Facebook", url: "/dashboard/social-media/facebook", },
          // { title: "LinkedIn", url: "/dashboard/social-media-marketing/linkedin", },
        ],
      },
      {
        title: "Email Marketing",
        url: "/dashboard/email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Campaigns", url: "/dashboard/email-marketing/campaigns", },
          { title: "Audiences", url: "/dashboard/email-marketing/audiences", },
          { title: "Email Builder", url: "/dashboard/email-marketing/email-builder", },
          { title: "Domains", url: "/dashboard/email-marketing/domain-configuration", },
        ],
      },
      {
        title: "SEO",
        url: "/dashboard/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
        title: "Zeepo Canvas",
        url: "/dashboard/zeepo-canvas",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Visual Studio",
        url: "/dashboard/gen-ai/image-gen-studio",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Image Generator",
        url: "/dashboard/gen-ai/image-generator",
        icon: (props: any) => React.createElement(Icons.AIImage, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Background Remover",
        url: "/dashboard/gen-ai/background-remover",
        icon: (props: any) => React.createElement(Icons.BackgroundRemover, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
        url: "/hq/dashboard",
        icon: (props: any) => React.createElement(Icons.Home, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Domains",
        url: "/hq/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Registration", url: "/hq/domains", },
          { title: "TLDs", url: "/hq/tlds", },
          { title: "Transfer", url: "/hq/domain-transfer", },
          { title: "Domains Portfolio", url: "/hq/domains-portfolio", },
        ],
      },
      {
        title: "Hosting",
        url: "/hq/hosting",
        icon: (props: any) => React.createElement(Icons.Hosting, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "WordPress",
        url: "/hq/wordpress",
        icon: (props: any) => React.createElement(Icons.Wordpress, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 2,
    label: "Digital Marketing",
    items: [
      {
        title: "Nisc Social",
        url: "/hq/social-media-marketing",
        icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Facebook", url: "/hq/social-media-marketing/facebook", },
          // { title: "Instagram", url: "/hq/social-media-marketing/instagram", },
          // { title: "Twitter", url: "/hq/social-media-marketing/twitter", },
          { title: "LinkedIn", url: "/hq/social-media-marketing/linkedin", },
          // { title: "TikTok", url: "/hq/social-media-marketing/tiktok", },
        ],
      },
      {
        title: "Nisc Email Marketing",
        url: "/hq/nisc-email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Campaigns", url: "/hq/nisc-email-marketing/campaigns", },
          { title: "Audiences", url: "/hq/nisc-email-marketing/audiences", },
          { title: "Email Builder", url: "/hq/nisc-email-marketing/email-builder", },
          { title: "Domains", url: "/hq/nisc-email-marketing/domain-configuration", },
        ],
      },
      {
        title: "Email Marketing",
        url: "/hq/email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          // { title: "Metrics", url: "/hq/email-marketing/metrics", },
          { title: "Campaigns", url: "/hq/email-marketing/campaigns", },
          // { title: "Emails", url: "/hq/email-marketing/emails", },
          { title: "Domains", url: "/hq/email-marketing/domain-configuration", },
          { title: "Audiences", url: "/hq/email-marketing/audiences", },
          // { title: "Segments", url: "/hq/segments", },
          // { title: "Templates", url: "/hq/email-marketing/templates", },
          { title: "Email Builder", url: "/hq/email-marketing/email-builder", },
        ],
      },
      {
        title: "SEO",
        url: "/hq/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Analytics", url: "/hq/seo-reports", },
          { title: "SEO Suite", url: "/hq/seo-suite", },
        ],
      },
      {
        title: "Creatives & Design",
        url: "/hq/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
      {
        title: "Zeepo Canvas",
        url: "/hq/zeepo-canvas",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Zeepo AI Agent",
        url: "/hq/zeepo-ai-agent",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Visual Studio",
        url: "/hq/gen-ai/image-gen-studio",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Image Generator",
        url: "/hq/gen-ai/image-generator",
        icon: (props: any) => React.createElement(Icons.AIImage, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Background Remover",
        url: "/hq/gen-ai/background-remover",
        icon: (props: any) => React.createElement(Icons.BackgroundRemover, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "AI Image Editor",
      //   url: "/hq/gen-ai/ai-image-editor",
      //   icon: (props: any) => React.createElement(Icons.BackgroundRemover, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
    ],
  },
  {
    id: 4,
    label: "Management",
    items: [
      {
        title: "Nisc Services",
        url: "/hq/nisc-services",
        icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Nisc Service Orders",
        url: "/hq/nisc-service-orders",
        icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
        subItems: [
          { title: "Clients", url: "/hq/clients", },
          { title: "Manage Organizations", url: "/hq/manage-organizations", },
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
        title: "Billing",
        url: "/hq/billing",
        icon: (props: any) => React.createElement(Icons.Billing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Transactions", url: "/hq/transactions", },
          { title: "Invoices", url: "/hq/invoices", },
          { title: "Subscriptions", url: "/hq/subscriptions", },
          { title: "Quotations", url: "/hq/quotations", },
        ],
      },
      {
        title: "KRA eTIMS",
        url: "/hq/kra-etims/sales",
        icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Sales", url: "/hq/kra-etims/sales", },
          { title: "Purchases", url: "/hq/kra-etims/purchases", },
          { title: "Products", url: "/hq/kra-etims/products", },
          { title: "Stock taking", url: "/hq/kra-etims/stock", },
          { title: "Imports", url: "/hq/kra-etims/imports", },
          { title: "Customers", url: "/hq/kra-etims/customers", },
          { title: "Branches", url: "/hq/kra-etims/branches", },
          { title: "Codes", url: "/hq/kra-etims/codes", },
          { title: "Notices", url: "/hq/kra-etims/notices", },
          { title: "Settings", url: "/hq/kra-etims/settings", },
        ],
      },
      {
        title: "Reports",
        url: "/hq/reports/sales",
        icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Sales Reports", url: "/hq/reports/sales", },
          { title: "Creative Reports", url: "/hq/reports/creative", },
        ],
      },
      {
        title: "Nisc Reporting",
        url: "/hq/nisc-reports",
        icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "Invoicing",
      //   url: "/hq/invoicing",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      // {
      //   title: "Support",
      //   url: "/hq/support",
      //   icon: (props: any) => React.createElement(Icons.Help, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      //   subItems: [
      //     { title: "Tickets", url: "/hq/support", },
      //     { title: "Knowledge Base", url: "/hq/support", },
      //     { title: "AI Assistant", url: "/hq/support", },
      //   ],
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
];
