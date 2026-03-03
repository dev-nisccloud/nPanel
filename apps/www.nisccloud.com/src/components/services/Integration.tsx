import aboutDataIntegration1Image from '@public/images/ns-img-57.png';
import aboutDataIntegration2Image from '@public/images/ns-img-58.svg';
import aboutDataIntegration3Image from '@public/images/ns-img-59.svg';
import aboutDataIntegration1DarkImage from '@public/images/ns-img-dark-35.png';
import aboutDataIntegration2DarkImage from '@public/images/ns-img-dark-36.svg';
import aboutDataIntegration3DarkImage from '@public/images/ns-img-dark-37.svg';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const Integration = () => {
  return (
    <section className="bg-background-2 dark:bg-background-5 overflow-hidden pt-[100px] pb-[100px] lg:pt-[200px]">
      <div className="main-container">
        <div className="grid grid-cols-1 items-center justify-center gap-y-28 sm:gap-y-10 md:gap-y-20 lg:mb-[120px] lg:grid-cols-2 lg:gap-[100px]">
          <div className="max-lg:order-0">
            {/*Integration Images*/}
            <div className="relative z-10 inline-block max-lg:left-1/2 max-lg:-translate-x-1/2">
              <RevealAnimation delay={0.2}>
                <figure className="max-w-[358px] rounded-[20px]">
                  <Image
                    src={aboutDataIntegration1Image}
                    alt="about-data-integration"
                    className="size-full rounded-[20px] object-cover dark:hidden"
                  />
                  <Image
                    src={aboutDataIntegration1DarkImage}
                    alt="about-data-integration"
                    className="hidden size-full rounded-[20px] object-cover dark:inline-block"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.3} direction="right">
                <figure className="absolute -top-12 -right-14 overflow-hidden rounded-2xl max-sm:w-[200px] sm:-top-[90px] sm:-right-[200px] md:-right-[150px] md:w-[250px] lg:-right-[150px] lg:w-[260px] xl:-right-[200px] xl:w-auto">
                  <Image
                    src={aboutDataIntegration2Image}
                    alt="about-data-integration"
                    className="block size-full object-cover dark:hidden"
                  />
                  <Image
                    src={aboutDataIntegration2DarkImage}
                    alt="about-data"
                    className="hidden size-full object-cover dark:block"
                  />
                </figure>
              </RevealAnimation>
              <RevealAnimation delay={0.4} direction="right">
                <figure className="absolute -right-14 bottom-12 -z-10 overflow-hidden rounded-2xl max-sm:w-[130px] sm:-right-[200px] sm:bottom-[85px] md:-right-[150px] lg:-right-[150px] xl:-right-[200px]">
                  <Image
                    src={aboutDataIntegration3Image}
                    alt="about-data-integration"
                    className="block size-full object-cover dark:hidden"
                  />
                  <Image
                    src={aboutDataIntegration3DarkImage}
                    alt="about-data-integration"
                    className="hidden size-full object-cover dark:inline-block"
                  />
                </figure>
              </RevealAnimation>
            </div>
          </div>
          {/*Integration Data*/}
          <div className="pt-5 max-lg:order-1">
            <div className="mx-auto max-w-[592px] text-center lg:mx-0 lg:max-w-full lg:text-left">
              <div className="mb-8 space-y-5">
                <RevealAnimation delay={0.2}>
                  <span className="badge badge-green mb-5">Data integrations</span>
                </RevealAnimation>
                <div className="mb-8 space-y-3">
                  <RevealAnimation delay={0.3}>
                    <h2 className="mx-auto max-w-[592px] lg:mx-0">
                      A clear vision is essential for understanding wealth dynamics.
                    </h2>
                  </RevealAnimation>
                  <RevealAnimation delay={0.4}>
                    <p>
                      A clear vision is essential for understanding wealth dynamics because it provides direction,
                      purpose, and clarity in navigating financial growth and sustainability.
                    </p>
                  </RevealAnimation>
                </div>
              </div>
              <ul className="mb-14 flex items-center gap-6 max-sm:flex-col sm:items-start">
                <RevealAnimation delay={0.5}>
                  <li className="flex items-center gap-2">
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0">
                      <path
                        d="M15.1875 5.0625L7.3125 12.9371L3.375 9"
                        className="stroke-secondary dark:stroke-accent"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-secondary text-tagline-1 dark:text-accent/60 font-medium">
                      On demand support
                    </span>
                  </li>
                </RevealAnimation>
                <RevealAnimation delay={0.6}>
                  <li className="flex items-center gap-2">
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0">
                      <path
                        d="M15.1875 5.0625L7.3125 12.9371L3.375 9"
                        className="stroke-secondary dark:stroke-accent"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-secondary text-tagline-1 dark:text-accent/60 font-medium">
                      Information Sharing
                    </span>
                  </li>
                </RevealAnimation>
                <RevealAnimation delay={0.7}>
                  <li className="flex items-center gap-2">
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0">
                      <path
                        d="M15.1875 5.0625L7.3125 12.9371L3.375 9"
                        className="stroke-secondary dark:stroke-accent"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-secondary text-tagline-1 dark:text-accent/60 font-medium">
                      Cloud Technology
                    </span>
                  </li>
                </RevealAnimation>
              </ul>
              <RevealAnimation delay={0.8}>
                <div>
                  <LinkButton
                    href="/integration"
                    className="btn-v3-lg btn-v3-secondary mx-auto w-[80%] sm:w-fit lg:mx-0">
                    Start Your Journey
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

Integration.displayName = 'Integration';
export default Integration;
