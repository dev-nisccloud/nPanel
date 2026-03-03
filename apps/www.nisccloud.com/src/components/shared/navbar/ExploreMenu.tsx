'use client';

import {
  AnalyticsIcon,
  ExploreProductIcon,
  FeatureIcon,
  IntegrationIcon,
  PricingIcon,
  ServiceIcon,
} from '@/icons/menu-icon';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import type { ComponentType } from 'react';

type ExploreItem = {
  label: string;
  href: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

type ExploreSection = {
  title: string;
  items: ExploreItem[];
};

const exploreSections: ExploreSection[] = [
  {
    title: 'Domains',
    items: [
      {
        label: 'Registration',
        href: '/domain-search',
        description: 'Register new .ke and global domains',
        icon: ServiceIcon,
      },
      {
        label: 'Transfer',
        href: '/services/domains',
        description: 'Move your domains to Nisc Cloud',
        icon: PricingIcon,
      },
    ],
  },
  {
    title: 'Hosting',
    items: [
      {
        label: 'Website Hosting',
        href: '/services/website-hosting',
        description: 'Fast, secure hosting for your site',
        icon: FeatureIcon,
      },
      {
        label: 'WordPress Hosting',
        href: '/services/wordpress-hosting',
        description: 'Managed WordPress, tuned for speed',
        icon: IntegrationIcon,
      },
      {
        label: 'VPS Hosting',
        href: '/services/vps-hosting',
        description: 'Dedicated resources and full control',
        icon: AnalyticsIcon,
      },
      {
        label: 'Dedicated Hosting',
        href: '/services/dedicated-hosting',
        description: 'Entire server for your workload',
        icon: ExploreProductIcon,
      },
    ],
  },
  {
    title: 'Email',
    items: [
      {
        label: 'Business Email',
        href: '/services/business-email',
        description: 'Professional email on your domain',
        icon: ServiceIcon,
      },
      {
        label: 'Email Marketing',
        href: '/email-marketing',
        description: 'Campaigns with a drag-and-drop builder',
        icon: FeatureIcon,
      },
    ],
  },
  {
    title: 'Digital Marketing',
    items: [
      {
        label: 'SEO',
        href: '/services/seo',
        description: 'Get found on search engines',
        icon: AnalyticsIcon,
      },
      {
        label: 'Social Media Marketing',
        href: '/services/social-media-marketing',
        description: 'Grow and manage your social presence',
        icon: IntegrationIcon,
      },
      {
        label: 'Media Buying',
        href: '/services/media-buying',
        description: 'Plan and buy ads across channels',
        icon: PricingIcon,
      },
      {
        label: 'Pay Per Click',
        href: '/services/pay-per-click',
        description: 'Targeted ads you can measure',
        icon: ExploreProductIcon,
      },
    ],
  },
];

const ctaLinkClass =
  'border-stroke-1 dark:border-stroke-7 hover:border-secondary/30 dark:hover:border-stroke-8 shadow-14 flex items-start gap-2 rounded-xl border p-3 transition-all duration-300';

const ExploreMenu = ({
  menuDropdownId,
  setMenuDropdownId,
}: {
  menuDropdownId: string | null;
  setMenuDropdownId: (id: string | null) => void;
}) => {
  const handleClose = () => setMenuDropdownId(null);

  return (
    <div>
      <div
        className={cn(
          'pointer-events-none fixed top-full left-1/2 z-40 h-3 w-full -translate-x-1/2 bg-transparent opacity-0 lg:w-[1290px]',
          menuDropdownId === 'explore-mega-menu' ? 'pointer-events-auto! opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        id="explore-mega-menu"
        className={cn(
          'dark:bg-background-6 border-stroke-1/50 dark:border-background-7 pointer-events-none fixed top-full left-1/2 z-50 mt-2 w-full -translate-x-1/2 rounded-[20px] border bg-white px-6 pt-3 pb-6 opacity-0 transition-all duration-300 lg:w-[1290px]',
          menuDropdownId === 'explore-mega-menu'
            ? 'pointer-events-auto! translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2.5 opacity-0',
        )}>
        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
          {exploreSections.map(({ title, items }) => (
            <div className="col-span-12 sm:col-span-6 lg:col-span-3" key={title}>
              <div className="flex flex-col">
                <p className="text-tagline-2 text-secondary/60 dark:text-accent/60 p-3 font-medium">{title}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {items.map(({ label, href, description, icon: Icon }) => (
                    <li key={label}>
                      <Link href={href} onClick={handleClose} className={ctaLinkClass}>
                        <div className="border-stroke-1 dark:border-stroke-7 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border p-1">
                          <Icon className="size-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-tagline-1 text-secondary dark:text-accent font-normal">{label}</p>
                          <p className="text-tagline-2 text-secondary/80 dark:text-accent/80 font-normal">
                            {description}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

ExploreMenu.displayName = 'ExploreMenu';
export default ExploreMenu;
