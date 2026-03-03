'use client';

import NumberAnimation from '@/components/animation/NumberAnimation';
import RevealAnimation from '@/components/animation/RevealAnimation';
import { TransferSuccessIcon } from '@/icons';
import progressBarImage from '@public/images/ns-img-572.svg';
import savingsImage from '@public/images/ns-img-573.svg';
import Image from 'next/image';

const SavingsProjectionsCard = () => {
  return (
    <RevealAnimation delay={0.3}>
      <div className="col-span-12 lg:col-span-6">
        <div
          className="bg-background-4 space-y-1 overflow-hidden rounded-3xl p-1 md:rounded-[28px]"
          itemScope
          itemType="https://schema.org/Service"
          itemProp="hasOfferCatalog">
          <div className="relative h-[300px] w-full rounded-3xl bg-white p-4 sm:h-[375px]">
            {/* top img  */}
            <RevealAnimation delay={0.4}>
              <div className="absolute top-[28px] left-1/2 -translate-x-1/2 sm:top-[58px]">
                <div
                  className="flex w-[138px] flex-col items-center justify-center gap-y-1 rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(111deg, #142e6e 28.63%, #edf3ff 127.29%)',
                  }}
                  aria-label="Transfer success notification">
                  <span className="flex size-9 items-center justify-center" aria-hidden="true">
                    <TransferSuccessIcon />
                  </span>
                  <p className="text-tagline-2 font-normal text-white">Transfer success!</p>
                </div>
              </div>
            </RevealAnimation>

            {/* progress bar  */}
            <RevealAnimation delay={0.4}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-background-3 w-[288px] space-y-2 rounded-xl p-4 max-[376px]:w-[250px]">
                  <div className="flex w-full items-center justify-between">
                    <h3 className="text-tagline-1 inline-block font-normal">Credit limit</h3>
                    <h3 className="text-tagline-2 text-secondary flex items-center justify-center font-medium">
                      $
                      <NumberAnimation
                        number={80}
                        speed={2000}
                        interval={200}
                        rooms={2}
                        heightSpaceRatio={2.3}
                        className="ml-0.5"
                      />
                      ,
                      <NumberAnimation number={224} speed={2000} interval={200} rooms={3} heightSpaceRatio={2.3} />
                    </h3>
                  </div>

                  <div className="flex items-center gap-x-3">
                    <figure className="w-full max-w-[221px]" itemScope itemType="https://schema.org/ImageObject">
                      <Image
                        src={progressBarImage}
                        alt="Credit limit progress bar visualization"
                        width={221}
                        height={50}
                        className="size-full"
                        itemProp="contentUrl"
                        loading="lazy"
                      />
                    </figure>
                    <p className="text-tagline-3 text-secondary font-normal" aria-label="Credit limit usage percentage">
                      48%
                    </p>
                  </div>
                </div>
              </div>
            </RevealAnimation>

            {/* bottom img  */}
            <RevealAnimation delay={0.4}>
              <figure
                className="absolute bottom-[72px] left-[48px] sm:bottom-[111px] md:left-[191px]"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={savingsImage}
                  alt="Financial savings visualization"
                  width={150}
                  height={150}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                />
              </figure>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.2}>
            <div className="h-[120px] w-full space-y-2.5 rounded-3xl bg-white p-4">
              <h4 className="text-heading-6 text-secondary/90 font-normal" itemProp="name">
                Savings & Projections
              </h4>
              <p className="text-secondary/60 text-tagline-1 max-w-[300px] font-normal" itemProp="description">
                Predict financial outcomes with smart forecasting tools.
              </p>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </RevealAnimation>
  );
};

SavingsProjectionsCard.displayName = 'SavingsProjectionsCard';
export default SavingsProjectionsCard;
