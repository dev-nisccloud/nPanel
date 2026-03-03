import personTablet from '@public/images/ns-img-117.png';
import marketSalesCard from '@public/images/ns-img-118.png';
import personTabletDark from '@public/images/ns-img-dark-87.png';
import marketSalesCardDark from '@public/images/ns-img-dark-88.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';

const features = [
  { id: 1, shape: 'ns-shape-50', text: 'Enterprise-level security' },
  { id: 2, shape: 'ns-shape-52', text: 'Automated email flows' },
  { id: 3, shape: 'ns-shape-41', text: 'Real-time analytics' },
  { id: 4, shape: 'ns-shape-47', text: 'Live data insights' },
];

const FeaturesHighlight = () => {
  return (
    <section className="bg-background-1 dark:bg-background-6 overflow-hidden pt-10 pb-10 md:pt-12 md:pb-12 lg:pt-16 lg:pb-16 xl:pt-20 xl:pb-20">
      <div className="main-container">
        <div className="flex flex-col gap-y-12 lg:flex-row lg:items-center lg:gap-x-24">
          <div className="flex flex-col items-start md:flex-1">
            <div className="mb-6 space-y-5 lg:mb-14">
              <RevealAnimation delay={0.2}>
                <span className="badge badge-green">Reasons to select us</span>
              </RevealAnimation>
              <div className="space-y-3">
                <RevealAnimation delay={0.3}>
                  <h2 className="lg:max-w-[465px]">NextSaaS your smart email choice</h2>
                </RevealAnimation>
                <RevealAnimation delay={0.4}>
                  <p className="lg:max-w-[508px]">
                    Until recently, the prevailing view assumed lorem ipsum was born as a nonsense text nothing Before
                    &amp; After magazine.
                  </p>
                </RevealAnimation>
              </div>
            </div>
            <ul className="md:space-y-2">
              {features.map((feature) => (
                <RevealAnimation key={feature.id} delay={0.4 + feature.id * 0.1}>
                  <li className="text-tagline-1 dark:text-accent flex items-center gap-4 py-2 font-medium md:px-3">
                    <span className={`${feature.shape} text-secondary dark:text-accent text-[36px]`}> </span>
                    {feature.text}
                  </li>
                </RevealAnimation>
              ))}
            </ul>
          </div>
          <div className="relative flex w-full justify-start md:flex-1 lg:w-auto">
            <RevealAnimation delay={0.6} offset={70}>
              <figure className="h-auto w-full max-w-[605px]">
                <Image
                  src={personTablet}
                  alt="Smiling man using a tablet"
                  className="block h-auto w-full dark:hidden"
                  width={583}
                  height={707}
                  priority
                />
                <Image
                  src={personTabletDark}
                  alt="Smiling man using a tablet"
                  className="hidden dark:block"
                  width={583}
                  height={707}
                  priority
                />
              </figure>
            </RevealAnimation>
            <RevealAnimation direction="right" delay={0.8} offset={70}>
              <figure
                className="absolute right-2 -bottom-4 max-w-[200px] overflow-hidden rounded-[10px] sm:max-w-[324px] md:bottom-7 lg:-bottom-4 lg:rounded-[20px] 2xl:-right-10"
                aria-hidden="true">
                <Image
                  src={marketSalesCard}
                  alt="Market sales dashboard card"
                  width={324}
                  height={340}
                  className="block dark:hidden"
                  loading="lazy"
                />
                <Image
                  src={marketSalesCardDark}
                  alt="Market sales dashboard card"
                  width={324}
                  height={340}
                  className="shadow-2 hidden dark:block"
                  loading="lazy"
                />
              </figure>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesHighlight;
