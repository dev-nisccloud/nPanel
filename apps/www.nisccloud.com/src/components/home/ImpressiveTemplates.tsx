import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';
import AutomatedWorkflowsCard from './AutomatedWorkflowsCard';
import BudgetCard from './BudgetCard';
import FraudProtectionCard from './FraudProtectionCard';
import SavingsProjectionsCard from './SavingsProjectionsCard';

const ImpressiveTemplates = () => {
  return (
    <RevealAnimation delay={0.1}>
      <section
        className="mx-5 rounded-3xl bg-gradient-to-b from-[#142e6e] to-[#edf2ff] py-18 md:rounded-4xl md:py-20 lg:py-24 xl:rounded-[56px] xl:py-39"
        aria-labelledby="impressive-templates-heading"
        aria-describedby="impressive-templates-description"
        itemScope
        itemType="https://schema.org/Service">
        <div className="main-container">
          <div className="space-y-14 lg:space-y-[70px]">
            {/* text content  */}
            <div className="space-y-5 text-center" itemScope itemProp="about">
              <RevealAnimation delay={0.1}>
                <span className="badge bg-accent/20 text-tagline-3 text-white uppercase" aria-label="Section category">
                  Impressive templates
                </span>
              </RevealAnimation>
              <div className="space-y-4">
                <RevealAnimation delay={0.2}>
                  <h2
                    id="impressive-templates-heading"
                    className="text-accent mx-auto max-w-[800px] font-normal"
                    itemProp="name">
                    Empowering and strengthening your financial success
                  </h2>
                </RevealAnimation>
                <RevealAnimation delay={0.3}>
                  <p
                    id="impressive-templates-description"
                    className="text-accent/80 mx-auto max-w-[690px] text-lg leading-[150%] font-normal"
                    itemProp="description">
                    Grovia has partnered with growing businesses to build foundations for sustainable success. Explore
                    real stories of transformation.
                  </p>
                </RevealAnimation>
              </div>
            </div>

            {/* cards  */}
            <div
              className="grid grid-cols-12 gap-3 md:gap-2"
              aria-label="Financial management templates"
              itemScope
              itemType="https://schema.org/ItemList">
              <BudgetCard />
              <AutomatedWorkflowsCard />
              <FraudProtectionCard />
              <SavingsProjectionsCard />
            </div>
          </div>

          <RevealAnimation delay={0.4}>
            <div className="mx-auto mt-14 w-[80%] text-center sm:w-auto md:mx-0">
              <LinkButton
                href="/integration"
                className="btn-v3-secondary btn-v3-lg mx-auto w-full sm:w-fit"
                ariaLabel="Explore Tools">
                Explore Tools
              </LinkButton>
            </div>
          </RevealAnimation>
        </div>
      </section>
    </RevealAnimation>
  );
};

ImpressiveTemplates.displayName = 'ImpressiveTemplates';
export default ImpressiveTemplates;
