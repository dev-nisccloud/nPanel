'use client';

import RevealAnimation from '@/components/animation/RevealAnimation';
import lockImage from '@public/images/ns-img-570.svg';
import dotsImage2 from '@public/images/ns-img-574.svg';
import Image from 'next/image';

const FraudProtectionCard = () => {
  return (
    <div className="col-span-12 lg:col-span-6">
      <RevealAnimation delay={0.2}>
        <div
          className="bg-background-4 space-y-1 overflow-hidden rounded-3xl p-1 md:rounded-[28px]"
          itemScope
          itemType="https://schema.org/Service"
          itemProp="hasOfferCatalog">
          <div className="relative h-[300px] w-full rounded-3xl bg-[linear-gradient(to_bottom,#142e6e,#edf2ff)] p-4 sm:h-[375px]">
            {/* dot img  */}
            <RevealAnimation delay={0.4}>
              <figure
                className="absolute top-[76px] left-[3%] md:left-[25%]"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={dotsImage2}
                  alt=""
                  width={100}
                  height={100}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                  aria-hidden="true"
                />
              </figure>
            </RevealAnimation>

            {/* lock img  */}
            <figure
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              itemScope
              itemType="https://schema.org/ImageObject">
              <Image
                src={lockImage}
                alt="Fraud Protection security visualization"
                width={200}
                height={200}
                className="size-full"
                itemProp="contentUrl"
                loading="lazy"
              />
            </figure>
          </div>
          <RevealAnimation delay={0.2}>
            <div className="h-[120px] w-full space-y-2.5 rounded-3xl bg-white p-4">
              <h4 className="text-heading-6 text-secondary/90 font-normal" itemProp="name">
                Fraud Protection
              </h4>
              <p className="text-secondary/60 text-tagline-1 max-w-[300px] font-normal" itemProp="description">
                Your financial data is safeguarded with advanced security layers.
              </p>
            </div>
          </RevealAnimation>
        </div>
      </RevealAnimation>
    </div>
  );
};

FraudProtectionCard.displayName = 'FraudProtectionCard';
export default FraudProtectionCard;
