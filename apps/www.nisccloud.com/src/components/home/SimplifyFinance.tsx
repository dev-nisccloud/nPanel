import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';
import { FeatureCardIcon1, FeatureCardIcon2, FeatureCardIcon3, FeatureCardIcon4 } from '@/icons';
import featureImage1 from '@public/images/ns-img-563.png';
import featureImage2 from '@public/images/ns-img-564.png';
import Image from 'next/image';

const SimplifyFinance = () => {
  return (
    <section
      className="py-18 md:py-20 lg:py-24 xl:py-39"
      aria-labelledby="simplify-finance-heading"
      aria-describedby="simplify-finance-description"
      itemScope
      itemType="https://schema.org/Service">
      <div className="main-container">
        <div className="space-y-14">
          {/* text content  */}
          <div className="space-y-3 text-center lg:text-left" itemScope itemProp="about">
            <RevealAnimation delay={0.1}>
              <h2 id="simplify-finance-heading" className="font-normal" itemProp="name">
                Make payment easy, simplify your finance
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.2}>
              <p
                id="simplify-finance-description"
                className="max-w-[650px] text-lg leading-[150%] font-normal lg:max-w-[900px]"
                itemProp="description">
                Our platform managing personal finances or growing your investment portfolio, our system integrates the
                latest technology to help you make smarter financial decisions with ease.
              </p>
            </RevealAnimation>
          </div>

          {/* cards  */}
          <RevealAnimation delay={0.4}>
            <ul
              className="bg-background-4 grid grid-cols-12 items-center justify-center gap-3 overflow-hidden rounded-3xl p-3 lg:gap-2 lg:p-2 xl:gap-1 xl:p-1"
              aria-label="Financial management features"
              itemScope
              itemType="https://schema.org/ItemList">
              {/* card one  */}
              <li className="col-span-12 md:col-span-4 lg:col-span-3">
                <RevealAnimation delay={0.3}>
                  <div
                    className="flex h-[202px] w-full flex-col items-start justify-between rounded-[21px] bg-white p-4 lg:p-8"
                    itemScope
                    itemType="https://schema.org/Service"
                    itemProp="hasOfferCatalog">
                    <span
                      className="flex size-14 items-center justify-center rounded-xl bg-[#142E6E]"
                      aria-hidden="true">
                      <FeatureCardIcon1 />
                    </span>
                    <h3 className="text-heading-6 text-secondary/60 font-normal" itemProp="name">
                      1-Click Reports
                    </h3>
                  </div>
                </RevealAnimation>
              </li>

              {/* card two  */}
              <li className="col-span-12 md:col-span-4 lg:col-span-3">
                <RevealAnimation delay={0.4}>
                  <div
                    className="flex h-[202px] w-full flex-col items-start justify-between rounded-[21px] bg-white p-4 lg:p-8"
                    itemScope
                    itemType="https://schema.org/Service"
                    itemProp="hasOfferCatalog">
                    <span
                      className="flex size-14 items-center justify-center rounded-xl bg-[#142E6E]"
                      aria-hidden="true">
                      <FeatureCardIcon2 />
                    </span>
                    <h3 className="text-heading-6 text-secondary/60 font-normal" itemProp="name">
                      Savings & Projections
                    </h3>
                  </div>
                </RevealAnimation>
              </li>

              {/* card three  */}
              <li className="col-span-12 md:col-span-4 lg:col-span-3">
                <RevealAnimation delay={0.5}>
                  <div
                    className="flex h-[202px] w-full flex-col items-start justify-between rounded-[21px] bg-white p-4 lg:p-8"
                    itemScope
                    itemType="https://schema.org/Service"
                    itemProp="hasOfferCatalog">
                    <span
                      className="flex size-14 items-center justify-center rounded-xl bg-[#142E6E]"
                      aria-hidden="true">
                      <FeatureCardIcon3 />
                    </span>
                    <h3 className="text-heading-6 text-secondary/60 font-normal" itemProp="name">
                      Fraud Protection
                    </h3>
                  </div>
                </RevealAnimation>
              </li>

              {/* card four  */}
              <li className="col-span-12 row-span-2 md:col-span-4 lg:col-span-3">
                <RevealAnimation delay={0.6}>
                  <figure
                    className="group h-[408px] w-full overflow-hidden rounded-[21px]"
                    itemScope
                    itemType="https://schema.org/ImageObject">
                    <Image
                      src={featureImage1}
                      alt="Financial management platform dashboard showing simplified finance tools and analytics"
                      width={400}
                      height={408}
                      className="size-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      itemProp="contentUrl"
                      loading="lazy"
                    />
                  </figure>
                </RevealAnimation>
              </li>

              {/* card five  */}
              <li className="col-span-12 md:hidden lg:col-span-3 lg:block">
                <RevealAnimation delay={0.3}>
                  <div
                    className="flex h-[202px] w-full flex-col items-start justify-between rounded-[21px] bg-white p-4 lg:p-8"
                    itemScope
                    itemType="https://schema.org/Service"
                    itemProp="hasOfferCatalog">
                    <span
                      className="flex size-14 items-center justify-center rounded-xl bg-[#142E6E]"
                      aria-hidden="true">
                      <FeatureCardIcon4 />
                    </span>
                    <h3 className="text-heading-6 text-secondary/60 font-normal" itemProp="name">
                      Automated Workflows
                    </h3>
                  </div>
                </RevealAnimation>
              </li>

              {/* card six  */}
              <li className="col-span-12 md:col-span-8 lg:col-span-3">
                <RevealAnimation delay={0.4}>
                  <figure
                    className="group h-[202px] w-full overflow-hidden rounded-[21px]"
                    itemScope
                    itemType="https://schema.org/ImageObject">
                    <Image
                      src={featureImage2}
                      alt="Financial management tools and account integration interface"
                      width={400}
                      height={202}
                      className="size-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      itemProp="contentUrl"
                      loading="lazy"
                    />
                  </figure>
                </RevealAnimation>
              </li>

              {/* card seven  */}
              <li className="col-span-12 md:col-span-4 lg:col-span-3">
                <RevealAnimation delay={0.5}>
                  <div
                    className="flex h-[202px] w-full flex-col items-start justify-between rounded-[21px] bg-white p-4 lg:p-8"
                    itemScope
                    itemType="https://schema.org/Service"
                    itemProp="hasOfferCatalog">
                    <h3 className="text-heading-6 font-normal" itemProp="name">
                      Handle all your accounts in one place
                    </h3>
                    <div>
                      <LinkButton
                        href="/services"
                        className="btn-v3-secondary btn-v3-lg lg:btn-v3-lg"
                        ariaLabel="Explore more">
                        Explore more
                      </LinkButton>
                    </div>
                  </div>
                </RevealAnimation>
              </li>

              {/* card eight  */}
              <li className="col-span-4 hidden md:block lg:hidden">
                <RevealAnimation delay={0.3}>
                  <div
                    className="flex h-[202px] w-full flex-col items-start justify-between rounded-[21px] bg-white p-4 lg:p-8"
                    itemScope
                    itemType="https://schema.org/Service"
                    itemProp="hasOfferCatalog">
                    <span
                      className="flex size-14 items-center justify-center rounded-xl bg-[#142E6E]"
                      aria-hidden="true">
                      <FeatureCardIcon4 />
                    </span>
                    <h3 className="text-heading-6 text-secondary/60 font-normal" itemProp="name">
                      Automated Workflows
                    </h3>
                  </div>
                </RevealAnimation>
              </li>
            </ul>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

SimplifyFinance.displayName = 'SimplifyFinance';
export default SimplifyFinance;
