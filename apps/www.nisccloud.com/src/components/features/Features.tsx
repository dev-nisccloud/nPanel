import featureAsset1 from '@public/images/ns-img-67.png';
import featureAsset2 from '@public/images/ns-img-68.png';
import featureAsset3 from '@public/images/ns-img-69.png';
import featureAsset4 from '@public/images/ns-img-70.png';
import featureAsset5 from '@public/images/ns-img-71.png';
import featureAsset6 from '@public/images/ns-img-72.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';

const data = [
  {
    id: 1,
    title: 'Trusted by 2,000+ Businesses',
    description: 'From solo entrepreneurs to growing SMEs across Kenya and East Africa — our clients stay because we deliver.',
    img: featureAsset1,
  },
  {
    id: 2,
    title: 'Professional Business Email',
    description: 'Look credible with yourname@company.com — hosted, spam-protected, and works on any device from day one.',
    img: featureAsset2,
  },
  {
    id: 3,
    title: 'WordPress Hosting',
    description: 'One-click WordPress install, automatic updates, and performance-optimised servers — your site, always fast.',
    img: featureAsset3,
  },
  {
    id: 4,
    title: 'AI Creative Studio',
    description: 'Generate product images and remove backgrounds in seconds. Professional visuals for everyone, no designer needed.',
    img: featureAsset4,
  },
  {
    id: 5,
    title: '360° Digital Marketing',
    description: 'SEO, Social Media, PPC, and Email Marketing — all managed by our expert team so you can focus on your business.',
    img: featureAsset5,
  },
  {
    id: 6,
    title: 'Real Kenyan Support',
    description: 'Talk to a real human based in Nairobi. Phone, chat, or email — we pick up, every time.',
    img: featureAsset6,
  },
];

const FeatureCard = () => {
  return (
    <section className="overflow-hidden pt-8 pb-8 sm:pt-8 md:pt-8 xl:pt-8">
      <div className="main-container">
        <div className="mb-14 space-y-3 text-center">
          <RevealAnimation delay={0.3}>
            <h2 className="mx-auto max-w-[742px]">Everything Your Business Needs. All in One Place.</h2>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <p className="mx-auto max-w-[482px]">
              Nisc Cloud gives you powerful, easy-to-use tools to host, market, and grow your business — without the technical overwhelm.
            </p>
          </RevealAnimation>
        </div>
        <div className="grid grid-cols-12 max-md:gap-y-8 md:gap-8">
          {data.map((feature, index) => (
            <RevealAnimation delay={0.5 + index * 0.1} key={feature.id}>
              <div className="bg-background-2 dark:bg-background-5 col-span-12 space-y-6 rounded-[20px] p-6 md:col-span-6 lg:col-span-4">
                <figure className="w-full max-w-[360px]">
                  <Image src={feature.img} alt={feature.title} className="h-full w-full rounded-2xl object-cover" />
                </figure>
                <div className="space-y-1">
                  <h3 className="text-heading-5">{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};
FeatureCard.displayName = 'FeatureCard';
export default FeatureCard;
