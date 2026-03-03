import { TabProvider } from '@/context/TabContext';
import RevealAnimation from '../animation/RevealAnimation';
import PricingTabContent from './PricingTabContent';
import PricingTabList from './PricingTabList';

const Pricing = () => {
  return (
    <section className="pt-32 pb-20 sm:pt-36 md:pt-42 md:pb-[100px] lg:pb-[150px] xl:pt-[180px] xl:pb-[200px]">
      <div className="bg-background-1 mx-auto w-full max-w-[1440px] space-y-[40px] rounded-2xl px-5 py-[60px] md:px-6 lg:px-10 xl:px-16 dark:bg-black">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <RevealAnimation delay={0.1}>
            <span className="badge badge-cyan-v2">Our pricing</span>
          </RevealAnimation>
          <RevealAnimation delay={0.2}>
            <h2>Select the pricing plan that best suits your needs.</h2>
          </RevealAnimation>
        </div>

        <TabProvider defaultValue={0}>
          <PricingTabList />
          <PricingTabContent />
        </TabProvider>
      </div>
    </section>
  );
};

Pricing.displayName = 'Pricing';
export default Pricing;
