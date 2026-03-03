'use client';

import RevealAnimation from '@/components/animation/RevealAnimation';
import budgetGraph from '@public/images/ns-img-565.svg';
import Image from 'next/image';

const BudgetCard = () => {
  return (
    <div className="col-span-12 lg:col-span-6">
      <RevealAnimation delay={0.1}>
        <div
          className="bg-background-4 space-y-1 overflow-hidden rounded-3xl p-1 md:rounded-[28px]"
          itemScope
          itemType="https://schema.org/Service"
          itemProp="hasOfferCatalog">
          <div className="relative h-[300px] w-full rounded-3xl bg-white p-4 sm:h-[375px]">
            <div>
              <RevealAnimation delay={0.2}>
                <div className="space-y-1">
                  <p className="text-heading-5 font-normal">Budget</p>
                  <h3 className="text-heading-3 font-normal">$300.689</h3>
                </div>
              </RevealAnimation>

              {/* bottom graph */}
              <RevealAnimation delay={0.3}>
                <figure
                  className="absolute bottom-[-32px] left-1/2 h-[203px] w-full max-w-[580px] -translate-x-1/2 rotate-[-1.95deg]"
                  itemScope
                  itemType="https://schema.org/ImageObject">
                  <Image
                    src={budgetGraph}
                    alt="Budget graph showing financial data visualization"
                    width={580}
                    height={203}
                    className="size-full"
                    itemProp="contentUrl"
                    loading="lazy"
                  />
                </figure>
              </RevealAnimation>
            </div>
          </div>
          <RevealAnimation delay={0.2}>
            <div className="h-[120px] w-full space-y-2.5 rounded-3xl bg-white p-4">
              <h4 className="text-heading-6 text-secondary/90 font-normal" itemProp="name">
                1-Click Reports
              </h4>
              <p className="text-secondary/60 text-tagline-1 max-w-[200px] font-normal" itemProp="description">
                Monthly & yearly summaries generated instantly.
              </p>
            </div>
          </RevealAnimation>
        </div>
      </RevealAnimation>
    </div>
  );
};

BudgetCard.displayName = 'BudgetCard';
export default BudgetCard;
