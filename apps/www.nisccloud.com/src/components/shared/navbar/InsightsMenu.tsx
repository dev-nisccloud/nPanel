'use client';
import {
  AffiliateIcon,
  AnalyticsIcon,
  ChangeLogIcon,
  GlossaryIcon,
  WhitePaperIcon,
} from '@/icons/menu-icon';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import type { ComponentType } from 'react';
import HoverBgTransform from '../hover-bg-transform';

type InsightsLink = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType;
};

const insightLinks: InsightsLink[] = [
  {
    title: 'Affiliate',
    description: 'Partner with us',
    href: '/affiliates',
    icon: AffiliateIcon,
  },
  {
    title: 'Analytics',
    description: 'Track performance metrics',
    href: '/analytics',
    icon: AnalyticsIcon,
  },
  {
    title: 'Whitepaper',
    description: 'Download research papers',
    href: '/whitepaper',
    icon: WhitePaperIcon,
  },
  {
    title: 'Glossary',
    description: 'Browse key terms and definitions',
    href: '/glossary',
    icon: GlossaryIcon,
  },
  {
    title: 'Changelog',
    description: 'View latest updates and changes',
    href: '/changelog',
    icon: ChangeLogIcon,
  },
];

const InsightsMenu = ({
  menuDropdownId,
  setMenuDropdownId,
}: {
  menuDropdownId: string | null;
  setMenuDropdownId: (id: string | null) => void;
}) => {
  return (
    <div>
      <div
        className={cn(
          'dropdown-menu-bridge pointer-events-none absolute top-full left-1/2 z-40 h-3 w-full min-w-[320px] -translate-x-1/2 bg-transparent opacity-0',
          menuDropdownId === 'insights-mega-menu'
            ? 'pointer-events-auto! opacity-100'
            : 'pointer-events-none opacity-0',
        )}
      />
      <ul
        id="insights-dropdown-menu"
        className={cn(
          'dropdown-menu dark:bg-background-6 shadow-14 border-stroke-1/50 dark:border-background-7 pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-[320px] -translate-x-1/2 rounded-[20px] border bg-white p-3 opacity-0 transition-all duration-300',
          menuDropdownId === 'insights-mega-menu'
            ? 'pointer-events-auto! translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2.5 opacity-0',
        )}>
        {insightLinks.map(({ title, description, href, icon: Icon }) => (
          <li key={title}>
            <Link
              href={href}
              onClick={() => setMenuDropdownId(null)}
              className="group relative flex items-start gap-3 rounded-2xl p-3 transition-all duration-300">
              <HoverBgTransform className="group-hover:opacity-100" />
              <div className="dark:bg-background-6 shadow-14 border-stroke-1 dark:border-background-7 relative z-10 flex size-11 items-center justify-center rounded-[10px] border bg-white p-3">
                <Icon />
              </div>
              <div className="relative z-10">
                <p className="text-tagline-1 text-secondary dark:text-accent font-normal">{title}</p>
                <p className="text-tagline-2 text-secondary/60 dark:text-accent/60 font-normal">{description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

InsightsMenu.displayName = 'InsightsMenu';
export default InsightsMenu;
