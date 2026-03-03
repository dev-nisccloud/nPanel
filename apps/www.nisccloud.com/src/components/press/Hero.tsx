//press hero
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const Hero = () => {
  return (
    <section className="pt-[100px] pb-16 lg:pt-[140px] lg:pb-20 xl:pt-[170px] xl:pb-28">
      <div className="main-container">
        <div className="text-center">
          <RevealAnimation delay={0.1}>
            <span className="badge badge-green-v2 mb-5"> Press </span>
          </RevealAnimation>
          <div className="mt-5 mb-14 space-y-4 text-center">
            <RevealAnimation delay={0.2}>
              <h1 className="font-normal">
                Stay <span className="text-primary-500">updated</span> with the latest <br />
                from NextSaaS
              </h1>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <p>
                Explore official press releases, product announcements,
                <br />
                and media coverage all in one place.
              </p>
            </RevealAnimation>
          </div>
          <div className="flex flex-col items-center justify-center gap-x-4 gap-y-3 md:flex-row md:gap-y-0">
            <RevealAnimation delay={0.4} direction="left" offset={50} instant>
              <div>
                <LinkButton href="#" className="btn-v3-lg btn-v3-secondary">
                  Download press kit
                </LinkButton>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.5} direction="left" offset={50} instant>
              <div className="w-3/5 sm:w-auto">
                <LinkButton href="/pricing" className="btn-v3-lg btn-v3-white w-full sm:w-fit">
                  Build Ai
                </LinkButton>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';
export default Hero;
