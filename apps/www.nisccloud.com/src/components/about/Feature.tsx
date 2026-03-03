import { DownArrowIcon, UpArrowIcon } from '@/icons';
import salesAssetImg from '@public/images/ns-img-362.svg';
import satisfiedUserAssetImg from '@public/images/ns-img-363.png';
import satisfiedUserAssetLightImg from '@public/images/ns-img-364.png';
import featureImg from '@public/images/ns-img-365.png';
import badgeImg from '@public/images/ns-img-66.svg';
import salesAssetDarkImg from '@public/images/ns-img-dark-209.svg';
import Image from 'next/image';
import NumberAnimation from '../animation/NumberAnimation';
import RevealAnimation from '../animation/RevealAnimation';

const Feature = () => {
  return (
    <section className="overflow-hidden pt-32 pb-14 sm:pt-36 md:pt-42 md:pb-16 lg:pb-[88px] xl:pt-[180px] xl:pb-[100px]">
      <div className="main-container space-y-14 md:space-y-[70px]">
        <div className="space-y-3 text-center">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-cyan mb-5">Passion meets purpose</span>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <h2 className="xl:text-heading-1 mx-auto font-medium lg:max-w-[980px]">
              Engineered for advancement. Crafted for potential.
            </h2>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <p className="mx-auto lg:max-w-[904px]">
              At NextSaaS, we create tools that simplify your work, scale with your growth, and bring clarity to
              complexity. From streamlining operations to unlocking insights, our platform is built to support your
              entire journey—from startup to enterprise.
            </p>
          </RevealAnimation>
        </div>

        {/* Features Grid */}
        <div className="flex flex-col-reverse items-start justify-around gap-x-4 gap-y-7 md:flex-row md:items-center lg:items-end 2xl:justify-evenly">
          {/* Left Column Images */}
          <article
            aria-label="Feature supporting images"
            className="flex flex-row items-center space-y-[25px] max-md:justify-between max-md:gap-2 md:hidden md:flex-col lg:block">
            <RevealAnimation delay={0.4} duration={2.8} useSpring={true} direction="left">
              <figure className="shadow-5 max-h-[250px] max-w-[254px] overflow-hidden rounded-2xl">
                <Image
                  src={salesAssetImg}
                  className="shadow-5 block size-full object-cover dark:hidden"
                  alt="Sales performance visualization"
                  loading="lazy"
                />
                <Image
                  src={salesAssetDarkImg}
                  className="shadow-5 hidden size-full object-cover dark:block"
                  alt="Sales performance visualization"
                  loading="lazy"
                />
              </figure>
            </RevealAnimation>

            <RevealAnimation delay={0.5} duration={2.2} useSpring={true}>
              <figure className="shadow-2 max-h-[110px] max-w-[143px] overflow-hidden rounded-2xl">
                <Image
                  src={satisfiedUserAssetImg}
                  className="block size-full object-cover dark:hidden"
                  alt="Sales Asset"
                />
                <Image
                  src={satisfiedUserAssetLightImg}
                  className="hidden size-full object-cover dark:block"
                  alt="Sales Asset"
                />
              </figure>
            </RevealAnimation>
          </article>

          {/* Center Main Feature Image */}
          <RevealAnimation delay={0.5} direction="up">
            <figure aria-label="Main feature visualization" className="max-h-[564px] max-w-[630px]">
              <Image
                src={featureImg}
                alt="Main platform feature visualization"
                loading="lazy"
                className="size-full object-cover"
              />
            </figure>
          </RevealAnimation>

          {/* Right Column  Balance */}
          <article className="space-y-[37px] max-md:w-full">
            <RevealAnimation delay={0.5} useSpring={true} duration={2.2}>
              <figure>
                <Image src={badgeImg} alt="Achievement badge" loading="lazy" />
              </figure>
            </RevealAnimation>

            {/* Investment  */}
            <RevealAnimation delay={0.4} direction="right">
              <div className="bg-secondary dark:bg-accent flex h-auto w-full flex-col items-start gap-1 rounded-2xl p-4 md:h-[91px] md:w-[148px]">
                <h3 className="text-tagline-2 text-accent dark:text-secondary font-normal">Investment target</h3>
                <h3 className="text-heading-5 text-ns-green dark:text-secondary flex items-center justify-center gap-0.5 font-normal">
                  <NumberAnimation number={76} speed={2500} interval={180} rooms={2} heightSpaceRatio={2.6}>
                    76
                  </NumberAnimation>
                  %
                </h3>
              </div>
            </RevealAnimation>

            {/* Balance Card */}
            <RevealAnimation delay={0.6} direction="right">
              <div className="max-w-full min-w-full rounded-2xl bg-white p-6 md:max-w-[288px] md:min-w-[288px] dark:bg-black">
                <div className="text-left">
                  <span className="text-tagline-2 text-secondary dark:text-accent font-normal">Balance</span>
                  <h3 className="mt-2 mb-[30px] flex items-center text-[40px] leading-[1.2] font-normal">
                    $
                    <NumberAnimation number={45324} speed={2000} interval={200} rooms={5} heightSpaceRatio={2.2} />
                  </h3>
                </div>

                <div className="flex gap-3">
                  {/* Income Card */}
                  <div className="bg-background-4 dark:bg-background-9 flex-1 space-y-2 rounded-xl p-4 text-left">
                    <div className="text-tagline-2 text-secondary dark:text-accent flex items-center justify-start gap-2">
                      <span className="bg-ns-red flex size-[18px] items-center justify-center rounded-full p-1">
                        <DownArrowIcon className="dark:fill-background-5 size-[8px]" />
                      </span>
                      Income
                    </div>
                    <div className="dark:text-accent flex items-center text-lg leading-[1.5] font-medium">
                      $
                      <NumberAnimation number={48000} speed={2000} interval={200} rooms={5} heightSpaceRatio={2.5} />
                    </div>
                  </div>

                  {/* Expenses Card */}
                  <div className="bg-background-4 dark:bg-background-9 flex-1 space-y-2 rounded-xl p-4 text-left">
                    <div className="text-tagline-2 text-secondary dark:text-accent flex items-center justify-start gap-2">
                      <span className="bg-ns-green flex size-[18px] items-center justify-center rounded-full p-1">
                        <UpArrowIcon className="dark:fill-background-5 size-[9px]" />
                      </span>
                      Expenses
                    </div>
                    <div className="dark:text-accent flex items-center text-lg leading-[1.5] font-medium">
                      $
                      <NumberAnimation number={2321} speed={2000} interval={200} rooms={5} heightSpaceRatio={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </RevealAnimation>
          </article>
        </div>
      </div>
    </section>
  );
};

Feature.displayName = 'Feature';
export default Feature;
