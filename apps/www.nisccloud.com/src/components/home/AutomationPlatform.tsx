import NumberAnimation from '@/components/animation/NumberAnimation';
import RevealAnimation from '@/components/animation/RevealAnimation';
import badge10 from '@public/images/badge/badge-10.svg';
import badge6 from '@public/images/badge/badge-6.svg';
import badge7 from '@public/images/badge/badge-7.svg';
import badge8 from '@public/images/badge/badge-8.svg';
import badge9 from '@public/images/badge/badge-9.svg';
import Image from 'next/image';

interface NumberCard {
  number: number;
  description: string;
}

const numberCards: NumberCard[] = [
  {
    number: 93,
    description: 'Customers who say using NextSaaS has made them better at their job',
  },
  {
    number: 87,
    description: 'Of users report saving 10+ hours per week with automation',
  },
  {
    number: 95,
    description: 'Customer satisfaction rate from top-tier enterprise clients',
  },
];

const badges = [
  { src: badge6, alt: 'badge-6' },
  { src: badge7, alt: 'badge-7' },
  { src: badge8, alt: 'badge-8' },
  { src: badge9, alt: 'badge-9' },
  { src: badge10, alt: 'badge-10' },
];

const AutomationPlatform = () => {
  return (
    <section className="py-18 md:py-20" aria-labelledby="automation-platform-heading">
      <div className="main-container">
        <div className="space-y-[35px] md:space-y-[70px]">
          <RevealAnimation delay={0.1}>
            <h2 id="automation-platform-heading" className="text-center font-normal">
              NextSaaS is the top financial management platform for 87% of Forbes Cloud 100 firms in 2025.
            </h2>
          </RevealAnimation>

          <div className="flex items-center justify-center gap-x-2" aria-label="Awards and recognition badges">
            {badges.map((badge, index) => (
              <RevealAnimation key={badge.alt} delay={0.2 + index * 0.1}>
                <figure className={`w-full max-w-[139px] ${index === 2 ? '' : 'scale-90'}`}>
                  <Image
                    src={badge.src}
                    alt={badge.alt}
                    width={139}
                    height={139}
                    className="size-full object-cover transition-transform duration-300"
                  />
                </figure>
              </RevealAnimation>
            ))}
          </div>
        </div>

        {/* number cards  */}
        <RevealAnimation delay={0.7}>
          <div
            className="bg-background-4 mt-14 flex flex-col items-center justify-center gap-x-1 gap-y-4 rounded-4xl p-1 lg:flex-row lg:gap-y-0"
            aria-label="Platform statistics and achievements">
            {numberCards.map((card, index) => (
              <RevealAnimation key={card.number} delay={0.7 + index * 0.1}>
                <div className="w-full max-w-[425px] space-y-2 rounded-[28px] bg-white p-8 md:p-[52px]">
                  <h3 className="flex items-center justify-start font-medium" aria-label={`${card.number} percent`}>
                    <NumberAnimation number={card.number} speed={1500} interval={150} heightSpaceRatio={2.1} />
                    <span className="font-inherit">%</span>
                  </h3>
                  <p>{card.description}</p>
                </div>
              </RevealAnimation>
            ))}
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

AutomationPlatform.displayName = 'AutomationPlatform';
export default AutomationPlatform;
