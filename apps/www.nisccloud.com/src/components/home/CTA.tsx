import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';

const CTA = () => {
  return (
    <section
      className="py-12 md:py-14 lg:py-18 xl:py-24"
      aria-labelledby="cta-heading"
      aria-describedby="cta-description"
      itemScope
      itemType="https://schema.org/WebPageElement">
      <div className="main-container">
        <div className="text-center">
          <div className="space-y-14">
            {/* text content   */}
            <div className="space-y-3" itemScope itemProp="about">
              <RevealAnimation delay={0.1}>
                <h2 id="cta-heading" className="mx-auto max-w-[550px] font-normal" itemProp="name">
                  Ready to Launch Your Business Online?
                </h2>
              </RevealAnimation>
              <RevealAnimation delay={0.2}>
                <p id="cta-description" className="mx-auto max-w-[380px]" itemProp="description">
                  Join 2,000+ African entrepreneurs already using Nisc Cloud to host, market, and grow their businesses.
                </p>
              </RevealAnimation>
            </div>

            {/* btns  */}
            <div
              className="flex flex-col items-center justify-center gap-y-4 md:flex-row md:gap-x-4 md:gap-y-0"
              aria-label="Call to action buttons">
              <RevealAnimation delay={0.3} direction="left" offset={50}>
                <div className="w-[80%] sm:w-full md:mx-0 md:w-auto">
                  <LinkButton
                    href="/hosting"
                    className="btn-v3-secondary btn-v3-lg w-full sm:w-fit"
                    ariaLabel="Get Started Today">
                    Get Started Today
                  </LinkButton>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.4} direction="left" offset={50}>
                <div className="w-[80%] sm:w-full md:mx-0 md:w-auto">
                  <LinkButton
                    href="/contact"
                    className="btn-v3-lg btn-v3-white bg-secondary/20 w-full text-white backdrop-blur-[2px] sm:w-fit"
                    ariaLabel="Talk to Our Team">
                    Talk to Our Team
                  </LinkButton>
                </div>
              </RevealAnimation>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

CTA.displayName = 'CTA';
export default CTA;
