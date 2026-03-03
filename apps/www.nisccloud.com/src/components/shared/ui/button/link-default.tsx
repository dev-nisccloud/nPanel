import { cn } from '@/utils/cn';
import Link from 'next/link';
import type { AnchorHTMLAttributes, FC, ReactNode } from 'react';
import { ArrowIcon } from '../icon';

export interface LinkDefaultProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
}

const LinkDefault: FC<LinkDefaultProps> = ({ href, children, className, ...rest }) => {
  const baseClass =
    'group/btn-default bg-background-7 hover:border-stroke-3/20 hover:bg-background-7/95 relative flex h-full max-h-12 items-center justify-center gap-2 overflow-hidden rounded-[4px] border border-transparent px-6 py-[13px] transition-all duration-300 ease-in-out';

  const content = (
    <>
      <div
        className="pointer-events-none absolute top-1/2 left-[-67%] size-full -translate-y-1/2 rotate-75 bg-[linear-gradient(180deg,hsla(21,63%,73%,0.1),hsla(0,0%,16%,0.17)_45%,hsla(0,0%,16%,0.09)_50%,hsla(21,63%,73%,0.1))] transition-none will-change-[left] group-hover/btn-default:left-[70%] group-hover/btn-default:transition-[left] group-hover/btn-default:duration-800 group-hover/btn-default:ease-in-out"
        aria-hidden
      />
      <span className="text-background-14 font-ibm-plex-mono text-tagline-2 font-medium">
        {children}
      </span>
      <div className="relative mt-[2.3px] flex size-6 items-center justify-center overflow-hidden">
        <span className="ease-custom-ease-1 absolute translate-x-0 opacity-100 transition-all duration-500 group-hover/btn-default:translate-x-6 group-hover/btn-default:opacity-0">
          <ArrowIcon />
        </span>
        <span className="ease-custom-ease-1 absolute -translate-x-6 opacity-0 transition-all duration-500 group-hover/btn-default:translate-x-0 group-hover/btn-default:opacity-100">
          <ArrowIcon />
        </span>
      </div>
    </>
  );

  // use anchor tag of external routes
  const isExternal =
    typeof href === 'string' &&
    (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'));

  if (isExternal) {
    return (
      <a
        href={href}
        className={cn(baseClass, className)}
        rel={rest.target === '_blank' ? 'noopener noreferrer' : rest.rel}
        {...rest}
      >
        {content}
      </a>
    );
  }

  // for internal routes
  return (
    <Link href={href} className={cn(baseClass, className)} {...rest}>
      {content}
    </Link>
  );
};

export { LinkDefault };
