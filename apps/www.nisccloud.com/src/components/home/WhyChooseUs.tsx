import NumberAnimation from '@/components/animation/NumberAnimation';
import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';
import dashboardImage from '@public/images/ns-img-562.png';
import Image from 'next/image';

interface StatCard {
  label: string;
  value: number;
  suffix: string;
  rooms: number;
  heightSpaceRatio: number;
  ariaLabel: string;
}

const statCards: StatCard[] = [
  {
    label: 'User Satisfaction',
    value: 95,
    suffix: '%',
    rooms: 2,
    heightSpaceRatio: 2.2,
    ariaLabel: '95 percent user satisfaction',
  },
  {
    label: 'Active Businesses',
    value: 15,
    suffix: 'K+',
    rooms: 2,
    heightSpaceRatio: 2.1,
    ariaLabel: '10,000 plus active businesses',
  },
  {
    label: 'Transactions Managed',
    value: 50,
    suffix: 'M+',
    rooms: 2,
    heightSpaceRatio: 2.1,
    ariaLabel: '50 million plus transactions managed',
  },
  {
    label: 'Financial Tools',
    value: 120,
    suffix: '+',
    rooms: 3,
    heightSpaceRatio: 2.1,
    ariaLabel: '120 plus financial tools',
  },
];

const WhyChooseUs = () => {
  return (
    <RevealAnimation delay={0.1}>
      <section
        className="mx-5 rounded-4xl bg-gradient-to-b from-[#142e6e] to-[#edf2ff] py-18 md:py-20 lg:py-24 xl:rounded-[56px] xl:py-39"
        aria-labelledby="why-choose-us-heading"
        itemScope
        itemType="https://schema.org/Service">
        <div className="main-container">
          <div className="space-y-14 md:space-y-[70px]">
            {/*  text content  */}
            <div className="flex flex-col items-center justify-between gap-y-5 lg:flex-row">
              <div className="max-w-[700px] space-y-4 text-center lg:text-left xl:max-w-[905px]">
                <RevealAnimation delay={0.1}>
                  <h2 id="why-choose-us-heading" className="text-accent font-normal" itemProp="name" aria-level={2}>
                    We empower individuals and businesses to take control of their finances.
                  </h2>
                </RevealAnimation>

                <RevealAnimation delay={0.2}>
                  <p
                    itemProp="description"
                    className="text-accent/80 font-normal"
                    aria-describedby="why-choose-us-heading">
                    NextSaaS is built with the mission to simplify complex financial processes. Whether you&apos;re a
                    growing startup or an established enterprise, our tools help you make smarter decisions with
                    confidence
                  </p>
                </RevealAnimation>
              </div>

              <RevealAnimation delay={0.4}>
                <div className="mt-auto mb-0 flex w-full items-center justify-center md:w-auto">
                  <div className="mx-auto w-[80%] text-center sm:w-auto md:mx-0 md:text-right">
                    <LinkButton
                      href="/features"
                      className="btn-v3-white btn-v3-lg w-full sm:w-auto"
                      ariaLabel="Get started with NextSaaS">
                      Get started
                    </LinkButton>
                  </div>
                </div>
              </RevealAnimation>
            </div>

            {/* img  */}
            <div className="space-y-3 md:space-y-2 xl:space-y-1">
              <RevealAnimation delay={0.3}>
                <figure className="h-[380px] w-full max-w-[1290px] overflow-hidden rounded-4xl ring-2 ring-white sm:h-[612px]">
                  <Image
                    src={dashboardImage}
                    alt="Financial management platform dashboard showing analytics and financial data visualization"
                    width={1290}
                    height={612}
                    className="size-full rounded-[28px] object-cover"
                    itemProp="image"
                    loading="lazy"
                  />
                </figure>
              </RevealAnimation>

              <RevealAnimation delay={0.4}>
                <div
                  className="rounded-4xl bg-white p-2"
                  aria-label="Platform statistics and achievements"
                  itemScope
                  itemType="https://schema.org/ItemList">
                  <ul className="grid grid-cols-12 items-center justify-center gap-x-2">
                    {statCards.map((stat) => (
                      <li
                        key={stat.label}
                        className="col-span-12 w-full max-w-[313px] space-y-2 rounded-2xl bg-white px-8 py-4 text-center md:col-span-6 lg:col-span-3 lg:text-left"
                        itemProp="itemListElement"
                        itemScope
                        itemType="https://schema.org/ListItem"
                        aria-label={`${stat.label}: ${stat.value}${stat.suffix}`}>
                        <p
                          className="text-secondary/40 text-heading-6 leading-[150%] font-normal text-nowrap"
                          itemProp="name">
                          {stat.label}
                        </p>
                        <h3
                          className="text-secondary flex items-center justify-center font-medium lg:justify-start"
                          itemProp="value"
                          aria-label={stat.ariaLabel}>
                          <NumberAnimation
                            number={stat.value}
                            speed={1000}
                            interval={180}
                            rooms={stat.rooms}
                            heightSpaceRatio={stat.heightSpaceRatio}
                          />
                          {stat.suffix}
                        </h3>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealAnimation>
            </div>
          </div>
        </div>
      </section>
    </RevealAnimation>
  );
};

WhyChooseUs.displayName = 'WhyChooseUs';
export default WhyChooseUs;
