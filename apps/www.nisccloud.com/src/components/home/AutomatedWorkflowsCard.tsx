'use client';

import RevealAnimation from '@/components/animation/RevealAnimation';
import planeImage from '@public/images/ns-img-566.svg';
import boule1Image from '@public/images/ns-img-567.svg';
import boule2Image from '@public/images/ns-img-568.svg';
import boule3Image from '@public/images/ns-img-569.svg';
import dotsImage1 from '@public/images/ns-img-571.svg';
import Image from 'next/image';

const AutomatedWorkflowsCard = () => {
  return (
    <div className="col-span-12 lg:col-span-6">
      <RevealAnimation delay={0.1}>
        <div
          className="bg-background-4 space-y-1 overflow-hidden rounded-3xl p-1 md:rounded-[28px]"
          itemScope
          itemType="https://schema.org/Service"
          itemProp="hasOfferCatalog">
          <div className="relative h-[300px] w-full overflow-hidden rounded-3xl bg-[linear-gradient(to_bottom,#142e6e,#edf2ff)] p-4 sm:h-[375px]">
            {/* dots  */}
            <RevealAnimation delay={0.4}>
              <figure
                className="absolute top-[40px] left-1/2 h-[156px] w-full max-w-[216px] -translate-x-1/2 md:top-[30px]"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={dotsImage1}
                  alt=""
                  width={216}
                  height={156}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                  aria-hidden="true"
                />
              </figure>
            </RevealAnimation>

            {/* plane  */}
            <RevealAnimation delay={0.2}>
              <figure
                className="absolute bottom-[12px] left-1/2 h-[257px] w-[95px] -translate-x-1/2 md:bottom-[34px]"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={planeImage}
                  alt="Automated Workflows visualization"
                  width={95}
                  height={257}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                />
              </figure>
            </RevealAnimation>

            {/* 1st layer boule  */}
            <RevealAnimation delay={0.3}>
              <figure
                className="absolute bottom-[-25px] left-1/2 h-[228px] w-full max-w-[707px] -translate-x-1/2"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={boule1Image}
                  alt=""
                  width={707}
                  height={228}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                  aria-hidden="true"
                />
              </figure>
            </RevealAnimation>

            {/* 2nd layer boule  */}
            <RevealAnimation delay={0.4}>
              <figure
                className="absolute bottom-[-30px] left-0 h-[228px] w-full max-w-[643px] md:bottom-[-20px]"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={boule2Image}
                  alt=""
                  width={643}
                  height={228}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                  aria-hidden="true"
                />
              </figure>
            </RevealAnimation>

            {/* 3rd layer boule  */}
            <RevealAnimation delay={0.5}>
              <figure
                className="absolute bottom-[-60px] left-0 h-[204px] w-full max-w-[698px] md:bottom-[-40px]"
                itemScope
                itemType="https://schema.org/ImageObject">
                <Image
                  src={boule3Image}
                  alt=""
                  width={698}
                  height={204}
                  className="size-full"
                  itemProp="contentUrl"
                  loading="lazy"
                  aria-hidden="true"
                />
              </figure>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.2}>
            <div className="h-[120px] w-full space-y-2.5 rounded-3xl bg-white p-4">
              <h4 className="text-heading-6 text-secondary/90 font-normal" itemProp="name">
                Automated Workflows
              </h4>
              <p className="text-secondary/60 text-tagline-1 max-w-[200px] font-normal" itemProp="description">
                Reduce repetitive tasks with AI- powered automation.
              </p>
            </div>
          </RevealAnimation>
        </div>
      </RevealAnimation>
    </div>
  );
};

AutomatedWorkflowsCard.displayName = 'AutomatedWorkflowsCard';
export default AutomatedWorkflowsCard;
