'use client';

import { pricingCategories, type PricingCategory } from '@/data/pricing';
import { useTab } from '@/context/TabContext';
import { CheckIcon } from '@/icons';
import { cn } from '@/utils/cn';
import gradientImg from '@public/images/ns-img-496.png';
import Image from 'next/image';
import Link from 'next/link';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const PricingTabContent = () => {
  const { currentIndex } = useTab();
  const category: PricingCategory | undefined = pricingCategories[currentIndex];

  if (!category) {
    return null;
  }

  const { heading, description, plans, features } = category;

  return (
    <div className="mt-2 space-y-[40px]">
      <div className="mx-auto max-w-2xl space-y-1 text-center">
        <h3 className="text-heading-4">{heading}</h3>
        <p className="text-secondary/60 dark:text-accent/60 text-tagline-1">{description}</p>
      </div>
      <div className="grid grid-cols-12 gap-y-8">
      <RevealAnimation delay={0.3}>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <div>
            <div className="hidden h-[201px] w-[290px] md:block" />
            <div className="space-y-[10px]">
              <h4 className="text-heading-6">What’s included</h4>
              <ul>
                {features.map((feature) => (
                  <li key={feature.id} className="border-b-stroke-4 dark:border-stroke-7 h-14 border-b px-0 py-4">
                    <p className="text-secondary/60 dark:text-accent/60 text-tagline-1 font-normal">{feature.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </RevealAnimation>

      {plans.map((plan) => {
        const isHighlight = plan.variant === 'highlight';
        const isAdvanced = plan.id === 'advanced';

        return (
          <RevealAnimation key={plan.id} delay={plan.delay}>
            <div className="col-span-12 md:col-span-6 xl:col-span-3">
              <div>
                {isHighlight ? (
                  <div className="relative z-10 px-4">
                    <div className="bg-secondary relative overflow-hidden rounded-[20px] px-6 py-8">
                      <div className="absolute -top-28 -right-20 z-20 h-full w-full">
                        <Image src={gradientImg} alt="pricing bg" priority />
                      </div>
                      <div className="relative z-30 space-y-8">
                        <div>
                          <p
                            className={cn(
                              'text-tagline-1 mb-3 font-medium',
                              isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                            )}>
                            {plan.title}
                          </p>
                          <h4
                            className={cn(
                              'text-heading-5 font-normal',
                              isHighlight ? 'text-accent' : 'text-secondary dark:text-accent/60',
                            )}>
                            {plan.priceLabel}
                          </h4>
                          <p
                            className={cn(
                              isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                            )}>
                            {plan.description}
                          </p>
                        </div>
                        <Link
                          href="/contact-us"
                          className={cn(
                            'btn btn-md w-full first-letter:uppercase before:content-none',
                            isAdvanced
                              ? 'btn-primary hover:btn-white dark:hover:btn-accent'
                              : 'btn-white hover:btn-primary dark:btn-white-dark',
                          )}>
                          Get started
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4">
                    <div className="bg-background-3 dark:bg-background-8 space-y-8 rounded-[20px] px-6 py-8">
                      <div>
                        <p
                          className={cn(
                            'text-tagline-1 mb-3 font-medium',
                            isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                          )}>
                          {plan.title}
                        </p>
                        <h4
                          className={cn(
                            'text-heading-5 font-normal',
                            isHighlight ? 'text-accent' : 'text-secondary dark:text-accent/60',
                          )}>
                          {plan.priceLabel}
                        </h4>
                        <p
                          className={cn(
                            isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                          )}>
                          {plan.description}
                        </p>
                      </div>
                      <Link
                        href="/contact-us"
                        className={cn(
                          'btn btn-md w-full first-letter:uppercase before:content-none',
                          isAdvanced
                            ? 'btn-primary hover:btn-white dark:hover:btn-accent'
                            : 'btn-white hover:btn-primary dark:btn-white-dark',
                        )}>
                        Get started
                      </Link>
                    </div>
                  </div>
                )}
                <div className="flex flex-col space-y-8 rounded-[20px]">
                  <ul>
                    <li className="border-b-stroke-4 dark:border-stroke-7 h-14 border-b px-6 py-4 text-center">
                      <p className="text-secondary/60 dark:text-accent/60 font-medium">{plan.limit}</p>
                    </li>
                    {features.map((feature) => {
                      const isAvailable = feature.availability[plan.id];
                      return (
                        <li
                          key={`${plan.id}-${feature.id}`}
                          className="border-b-stroke-4 dark:border-stroke-7 flex h-14 items-center justify-center border-b px-6 py-4 text-center">
                          <span
                            className={cn(
                              'flex size-5 items-center justify-center rounded-full transition-colors',
                              isAvailable ? 'bg-secondary dark:bg-accent' : 'bg-secondary/30 dark:bg-accent/40',
                            )}>
                            <CheckIcon className={cn(!isAvailable && 'opacity-50')} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="text-center">
                    <LinkButton href="/contact-us" className="btn-v3-lg btn-v3-primary mx-auto w-[80%] sm:w-fit">
                      Get started
                    </LinkButton>
                  </div>
                </div>
              </div>
            </div>
          </RevealAnimation>
        );
      })}
      </div>
    </div>
  );
};

export default PricingTabContent;
