import { cn } from '@/utils/cn';
import Link from 'next/link';
import type { AnchorHTMLAttributes, FC, ReactNode } from 'react';
import { ArrowIcon } from '../icon';

export interface LinkPrimaryProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
}

const LinkPrimary: FC<LinkPrimaryProps> = ({ href, children, className, ...rest }) => {
  const baseClass =
    'group/btn-primary bg-background-14 hover:border-stroke-3/20 hover:bg-background-14/95 relative flex h-full max-h-12 items-center justify-center gap-2 overflow-hidden rounded-[4px] border border-transparent px-6 py-[13px] transition-all duration-300 ease-in-out';

  const content = (
    <>
      <div
        className="pointer-events-none absolute top-1/2 left-[-67%] size-full -translate-y-1/2 rotate-75 bg-[linear-gradient(180deg,hsla(21,63%,73%,0),hsla(0,0%,100%,0.2)_50%,hsla(21,63%,73%,0))] transition-none will-change-[left] group-hover/btn-primary:left-[70%] group-hover/btn-primary:transition-[left] group-hover/btn-primary:duration-800 group-hover/btn-primary:ease-in-out"
        aria-hidden
      />
      <span className="text-background-7 font-ibm-plex-mono text-tagline-2">{children}</span>
      <div className="relative mt-[2.3px] flex size-6 items-center justify-center overflow-hidden">
        <span className="ease-custom-ease-1 absolute translate-x-0 opacity-100 transition-all duration-500 group-hover/btn-primary:translate-x-6 group-hover/btn-primary:opacity-0">
          <ArrowIcon className="stroke-white" />
        </span>
        <span className="ease-custom-ease-1 absolute -translate-x-6 opacity-0 transition-all duration-500 group-hover/btn-primary:translate-x-0 group-hover/btn-primary:opacity-100">
          <ArrowIcon className="stroke-white" />
        </span>
      </div>
    </>
  );

  // use anchor tag for external routes
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

export { LinkPrimary };
