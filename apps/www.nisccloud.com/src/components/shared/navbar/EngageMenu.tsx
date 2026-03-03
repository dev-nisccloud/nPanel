'use client';
import { ContactIcon, CustomersIcon, ServiceIcon, TestimonialIcon } from '@/icons/menu-icon';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import type { ComponentType } from 'react';
import HoverBgTransform from '../hover-bg-transform';

type EngageLink = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType;
};

const engageLinks: EngageLink[] = [
  {
    title: 'Contact',
    description: 'Reach out to our team',
    href: '/contact-us',
    icon: ContactIcon,
  },
  {
    title: 'Services',
    description: 'Discover what we offer',
    href: '/services',
    icon: ServiceIcon,
  },
  {
    title: 'Careers',
    description: 'Join the Nisc Cloud team',
    href: '/career',
    icon: CustomersIcon,
  },
  {
    title: 'Testimonials',
    description: 'See client feedback',
    href: '/testimonial',
    icon: TestimonialIcon,
  },
  {
    title: 'Customers',
    description: 'See customer success',
    href: '/customer',
    icon: CustomersIcon,
  },
];

const EngageMenu = ({
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
          'pointer-events-none absolute top-full left-1/2 z-40 h-3 w-full min-w-[300px] -translate-x-1/2 bg-transparent opacity-0',
          menuDropdownId === 'engage-mega-menu' ? 'pointer-events-auto! opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <ul
        id="engage-dropdown-menu"
        className={cn(
          'dropdown-menu dark:bg-background-6 shadow-14 border-stroke-1/50 dark:border-background-7 pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-[300px] -translate-x-1/2 space-y-2.5 rounded-[20px] border bg-white p-3 opacity-0 transition-all duration-300',
          menuDropdownId === 'engage-mega-menu'
            ? 'pointer-events-auto! translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2.5 opacity-0',
        )}>
        {engageLinks.map(({ title, description, href, icon: Icon }) => (
          <li key={title}>
            <Link
              href={href}
              onClick={() => setMenuDropdownId(null)}
              className="group relative flex items-start gap-3 rounded-[10px] p-3 transition-all duration-300">
              <HoverBgTransform className="group-hover:opacity-100" />
              <div className="relative z-10 mt-1">
                <Icon />
              </div>
              <div className="relative z-10">
                <p className="text-tagline-1 text-secondary dark:text-accent font-normal">{title}</p>
                <p className="text-tagline-3 text-secondary/60 dark:text-accent/60 font-normal">{description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

EngageMenu.displayName = 'EngageMenu';
export default EngageMenu;
