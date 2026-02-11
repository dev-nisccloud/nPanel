import { Icons } from "@/components/icons";
import {
  type LucideIcon,
} from "lucide-react";
import { ComponentType } from "react";
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
        title: "Ad Campaigns",
        url: "/dashboard/ad-campaigns",
        icon: (props: any) => React.createElement(Icons.Campaigns, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Meta Ads", url: "/dashboard/ad-campaigns/meta-ads", },
          { title: "Google Ads", url: "/dashboard/ad-campaigns/google-ads", },
          { title: "LinkedIn Ads", url: "/dashboard/ad-campaigns/linkedin-ads", },
        ],
      },
      {
        title: "SEO",
        url: "/dashboard/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Creatives",
        url: "/dashboard/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Visual Creatives", url: "/dashboard/creative-assets", },
          { title: "Creative Briefs", url: "/dashboard/creative-briefs", },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
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
        title: "WordPress",
        url: "/agency/wordpress",
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
        url: "/agency/social-media-marketing",
        icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Facebook", url: "/agency/social-media-marketing/facebook", },
          // { title: "Instagram", url: "/agency/social-media-marketing/instagram", },
          // { title: "Twitter", url: "/agency/social-media-marketing/twitter", },
          { title: "LinkedIn", url: "/agency/social-media-marketing/linkedin", },
          // { title: "TikTok", url: "/agency/social-media-marketing/tiktok", },
        ],
      },
      {
        title: "Ad Campaigns",
        url: "/agency/ad-campaigns",
        icon: (props: any) => React.createElement(Icons.Campaigns, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Meta Ads", url: "/agency/ad-campaigns/meta-ads", },
          { title: "Google Ads", url: "/agency/ad-campaigns/google-ads", },
          { title: "LinkedIn Ads", url: "/agency/ad-campaigns/linkedin-ads", },
        ],
      },
      {
        title: "Email Marketing",
        url: "/agency/email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          // { title: "Metrics", url: "/agency/email-marketing/metrics", },
          { title: "Campaigns", url: "/agency/email-marketing/campaigns", },
          // { title: "Emails", url: "/agency/email-marketing/emails", },
          { title: "Domains", url: "/agency/email-marketing/domain-configuration", },
          // { title: "Audiences", url: "/agency/email-marketing/audiences", },
          // { title: "Segments", url: "/agency/segments", },
          // { title: "Templates", url: "/agency/email-marketing/templates", },
          { title: "Email Builder", url: "/agency/email-marketing/email-builder", },
        ],
      },
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
        title: "Visual Creatives",
        url: "/agency/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Visual Creatives", url: "/agency/creative-assets", },
          { title: "Creative Briefs", url: "/agency/creative-briefs", },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Gen AI Tools",
    items: [
      {
        title: "Visual Studio",
        url: "/agency/gen-ai/image-gen-studio",
        icon: (props: any) => React.createElement(Icons.AIImageStudio, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Image Generator",
        url: "/agency/gen-ai/image-generator",
        icon: (props: any) => React.createElement(Icons.AIImage, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Background Remover",
        url: "/agency/gen-ai/background-remover",
        icon: (props: any) => React.createElement(Icons.BackgroundRemover, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
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
        title: "Service Plans",
        url: "/agency/service-plans",
        icon: (props: any) => React.createElement(Icons.Plans, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Clients",
        url: "/agency/clients",
        icon: (props: any) => React.createElement(Icons.Clients, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Clients", url: "/agency/clients", },
          { title: "Manage Teams", url: "/agency/manage-teams", },
          // { title: "Create Client", url: "/agency/clients", },
          { title: "Manage Users", url: "/agency/manage-users", },
          // { title: "Manage Affiliates", url: "/agency/manage-affiliates", },
        ],
      },
      {
        title: "Orders",
        url: "/agency/orders",
        icon: (props: any) => React.createElement(Icons.Cart, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Orders", url: "/agency/orders", },
          // { title: "Create Order", url: "/agency/orders", },
        ],
      },
      {
        title: "Billing",
        url: "/agency/billing",
        icon: (props: any) => React.createElement(Icons.Billing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Transactions", url: "/agency/transactions", },
          { title: "Invoices", url: "/agency/invoices", },
          { title: "Subscriptions", url: "/agency/subscriptions", },
          // { title: "Quotations", url: "/agency/quotations", },
        ],
      },
      {
        title: "KRA eTIMS",
        url: "/agency/kra-etims",
        icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Dashboard", url: "/agency/kra-etims", },
          { title: "Sales", url: "/agency/kra-etims/sales", },
          { title: "Purchases", url: "/agency/kra-etims/purchases", },
          { title: "Stock", url: "/agency/kra-etims/stock", },
          { title: "Products", url: "/agency/kra-etims/products", },
          { title: "Branches", url: "/agency/kra-etims/branches", },
          { title: "Settings", url: "/agency/kra-etims/settings", },
        ],
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
