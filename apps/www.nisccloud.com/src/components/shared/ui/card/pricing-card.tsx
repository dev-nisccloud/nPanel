'use client';

import { LinkSecondary } from '@/components/shared/ui/button';
import { PricingPlan } from '@/interface';
import { cn } from '@/utils/cn';
import Image from 'next/image';
import type { FC } from 'react';

export interface PricingCardProps {
  plan: PricingPlan;
  isYearly: boolean;
  className?: string;
}

const PricingCard: FC<PricingCardProps> = ({ plan, isYearly, className }) => {
  const { name, monthlyPrice, yearlyPrice, featured, ctaHref, ctaLabel = 'Get Started' } = plan;

  return (
    <div
      className={cn(
        'relative flex min-w-full flex-col items-start justify-between rounded-lg px-6 pt-8 pb-6 lg:min-w-[260px]',
        featured ? 'bg-background-4 h-[368px] overflow-hidden' : 'h-[338px] bg-white',
        className
      )}
    >
      {featured && (
        <figure className="absolute top-0 left-0 z-10 size-full" aria-hidden>
          <Image
            src="/images/gradient/opai-2.png"
            alt="gradient-img"
            width={260}
            height={368}
            className="size-full object-cover"
          />
        </figure>
      )}
      <h3
        id={`plan-${plan.id}`}
        className={cn(
          'font-inter-tight text-tagline-2 relative z-20 font-normal',
          featured ? 'text-white/90' : 'text-secondary/60'
        )}
      >
        {name}
      </h3>
      <div className="relative z-20 space-y-3">
        <div className={cn('monthly', isYearly ? 'hidden' : 'block')} aria-live="polite">
          <h4
            className={cn(
              'font-instrument-serif text-is-heading-2 font-normal',
              featured ? 'text-white/90' : 'text-secondary'
            )}
          >
            <span className="sr-only">Price: </span>${monthlyPrice}
          </h4>
          <p
            className={cn(
              'font-inter-tight text-tagline-2 font-normal',
              featured ? 'text-white/60' : 'text-secondary/60'
            )}
          >
            Per month
          </p>
        </div>
        <div className={cn('yearly', isYearly ? 'block' : 'hidden')} aria-live="polite">
          <h4
            className={cn(
              'font-instrument-serif text-is-heading-2 font-normal',
              featured ? 'text-white/90' : 'text-secondary'
            )}
          >
            <span className="sr-only">Price: </span>${yearlyPrice}
          </h4>
          <p
            className={cn(
              'font-inter-tight text-tagline-2 font-normal',
              featured ? 'text-white/60' : 'text-secondary/60'
            )}
          >
            Per year
          </p>
        </div>
      </div>
      <div className="relative z-20 block w-full">
        <LinkSecondary href={ctaHref} className={cn(featured && 'border-white/20 text-white')}>
          {ctaLabel}
        </LinkSecondary>
      </div>
    </div>
  );
};

export { PricingCard };
