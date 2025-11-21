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
        url: "/dashboard/default",
        icon: (props: any) => React.createElement(Icons.Home, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Domains",
        url: "/dashboard/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
        title: "Files",
        url: "/dashboard/files",
        icon: (props: any) => React.createElement(Icons.File, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Databases",
        url: "/dashboard/databases",
        icon: (props: any) => React.createElement(Icons.Database, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Security",
        url: "/dashboard/security",
        icon: (props: any) => React.createElement(Icons.Security, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 2,
    label: "Creatives",
    items: [
      {
        title: "Creative Assets",
        url: "/dashboard/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 3,
    label: "Digital Marketing",
    items: [
      {
        title: "Email Marketing",
        url: "/dashboard/email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "SEO",
        url: "/dashboard/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      // {
      //   title: "Authentication",
      //   url: "/auth",
      //   icon: Fingerprint,
      //   subItems: [
      //     { title: "Login v1", url: "/auth/v1/login", newTab: true },
      //     { title: "Login v2", url: "/auth/v2/login", newTab: true },
      //     { title: "Register v1", url: "/auth/v1/register", newTab: true },
      //     { title: "Register v2", url: "/auth/v2/register", newTab: true },
      //   ],
      // },
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
      {
        title: "Help Center",
        url: "/dashboard/help-center",
        icon: (props: any) => React.createElement(Icons.Help, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
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
        url: "/agency/default",
        icon: (props: any) => React.createElement(Icons.Home, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
      {
        title: "Domains",
        url: "/agency/domains",
        icon: (props: any) => React.createElement(Icons.Site, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
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
          { title: "Quotations", url: "/agency/quotations", },
        ],
      },
      // {
      //   title: "Invoicing",
      //   url: "/agency/invoicing",
      //   icon: (props: any) => React.createElement(Icons.Invoices, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      // },
      {
        title: "Support",
        url: "/agency/support",
        icon: (props: any) => React.createElement(Icons.Help, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Tickets", url: "/agency/support", },
          { title: "Knowledge Base", url: "/agency/support", },
          { title: "AI Assistant", url: "/agency/support", },
        ],
      },
      {
        title: "Reports",
        url: "/agency/reports",
        icon: (props: any) => React.createElement(Icons.Reports, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Customer Reports", url: "/agency/reports", },
          { title: "Order Reports", url: "/agency/reports", },
          { title: "Transaction Reports", url: "/agency/reports", },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Creatives",
    items: [
      {
        title: "Creative Assets",
        url: "/agency/creative-assets",
        icon: (props: any) => React.createElement(Icons.CreativeAssets, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
  {
    id: 3,
    label: "Digital Marketing",
    items: [
      {
        title: "Social Media Marketing",
        url: "/agency/social-media-marketing",
        icon: (props: any) => React.createElement(Icons.SocialMediaMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Facebook", url: "/agency/social-media-marketing/facebook", },
          { title: "Instagram", url: "/agency/social-media-marketing/instagram", },
          { title: "Twitter", url: "/agency/social-media-marketing/twitter", },
          { title: "LinkedIn", url: "/agency/social-media-marketing/linkedin", },
          { title: "TikTok", url: "/agency/social-media-marketing/tiktok", },
        ],
      },
      {
        title: "Email Marketing",
        url: "/agency/email-marketing",
        icon: (props: any) => React.createElement(Icons.EmailMarketing, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
        subItems: [
          { title: "Metrics", url: "/agency/metrics", },
          { title: "Emails", url: "/agency/emails", },
          { title: "Campaigns", url: "/agency/campaigns", },
          { title: "Audiences", url: "/agency/audiences", },
          // { title: "Segments", url: "/agency/segments", },
          { title: "Templates", url: "/agency/templates", },
          { title: "Domains", url: "/agency/domains", },
          { title: "Email Builder", url: "/agency/email-builder", },
        ],
      },
      {
        title: "SEO",
        url: "/agency/seo",
        icon: (props: any) => React.createElement(Icons.Seo, { ...props, className: "!size-[20px] !mt-1 !-mr1.5" }),
      },
    ],
  },
];
