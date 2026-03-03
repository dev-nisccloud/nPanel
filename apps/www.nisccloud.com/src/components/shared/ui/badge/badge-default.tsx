import { cn } from '@/utils/cn';
import type { HTMLAttributes } from 'react';

export interface BadgeDefaultProps extends HTMLAttributes<HTMLDivElement> {
  text: string;
}

export const BadgeDefault = ({ text, className, ...rest }: BadgeDefaultProps) => {
  return (
    <div
      className={cn(
        'border-stroke-3/18 bg-background-9 inline-flex items-center justify-center gap-x-1.5 rounded-[4px] border px-[5px] py-0.5',
        className
      )}
      {...rest}
    >
      <span className="font-inter-tight text-tagline-4 text-accent/80 font-normal first-letter:uppercase">
        {text}
      </span>
    </div>
  );
};
