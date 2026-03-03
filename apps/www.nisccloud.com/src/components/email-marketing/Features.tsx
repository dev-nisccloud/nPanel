import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';

// Import images at the top
import featureAsset1 from '@public/images/ns-img-112.png';
import featureAsset2 from '@public/images/ns-img-113.png';
import featureAsset3 from '@public/images/ns-img-114.png';
import featureAsset4 from '@public/images/ns-img-115.png';
import featureAsset5 from '@public/images/ns-img-116.png';
import featureAssetDark1 from '@public/images/ns-img-dark-82.png';
import featureAssetDark2 from '@public/images/ns-img-dark-83.png';
import featureAssetDark3 from '@public/images/ns-img-dark-84.png';
import featureAssetDark4 from '@public/images/ns-img-dark-85.png';
import featureAssetDark5 from '@public/images/ns-img-dark-86.png';

const features = [
  {
    id: 1,
    light: featureAsset1,
    dark: featureAssetDark1,
    alt: 'Transactional email API UI',
    title: 'Drag & drop email builder',
    description: 'Design emails effortlessly, no coding needed.',

    className: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    id: 2,
    light: featureAsset2,
    dark: featureAssetDark2,
    alt: 'Transactional email API UI',
    title: 'Transactional email API',
    description: 'Send real-time order confirmations, password resets',

    className: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    id: 3,
    light: featureAsset3,
    dark: featureAssetDark3,
    alt: 'Transaction statistics',
    title: 'SMTP relay & webhooks',
    description: 'Seamless email infrastructure for developers.',

    className: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    id: 4,
    light: featureAsset4,
    dark: featureAssetDark4,
    alt: 'A/B testing stats',
    title: 'Advanced A/B testing',
    description: 'Optimize subject lines, content, and send times.',

    className: 'lg:col-start-3 col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    id: 5,
    light: featureAsset5,
    dark: featureAssetDark5,
    alt: 'Transactional email API UI',
    title: 'Deliverability management',
    description: 'Dedicated IPs, SPF, DKIM, and DMARC authentication.',

    className: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
];
const Features = () => {
  return (
    <section className="dark:bg-background-8 bg-white pt-12 pb-12 md:pt-16 md:pb-16 lg:pt-20 lg:pb-20 xl:pt-24 xl:pb-24">
      <div className="main-container">
        <div className="mb-12 text-center md:mb-[70px]">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-green mb-3.5 md:mb-5">More features</span>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <h2>Features that set NextSaaS apart</h2>
          </RevealAnimation>
        </div>
        <div className="grid grid-cols-12 items-center gap-y-12 sm:gap-x-8">
          {features.map((feature) => (
            <RevealAnimation key={feature.id} delay={0.4 + feature.id * 0.1}>
              <div className={feature.className}>
                <figure className="mb-3">
                  <Image src={feature.light} alt={feature.alt} className="block w-full rounded-xl dark:hidden" />
                  <Image src={feature.dark} alt={feature.alt} className="hidden w-full rounded-xl dark:block" />
                </figure>
                <h3 className="text-heading-6 md:text-heading-5 mb-1 font-normal">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </RevealAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
