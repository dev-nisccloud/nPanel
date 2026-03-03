import { ClockIcon, MessageIcon, TaskIcon, UserIcon } from '@/icons';
import avatar10 from '@public/images/ns-avatar-10.png';
import avatar11 from '@public/images/ns-avatar-11.png';
import avatar9 from '@public/images/ns-avatar-9.png';
import heroBgPattern from '@public/images/ns-img-109.svg';
import heroImg from '@public/images/ns-img-110.png';
import heroBgPatternDark from '@public/images/ns-img-dark-81.svg';
import Image from 'next/image';
import Link from 'next/link';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32" aria-label="Hero section">
      <RevealAnimation delay={0.2} duration={0.4} useSpring={true} offset={0}>
        <div className="absolute top-[10%] left-1/2 z-[1] h-full w-full -translate-x-1/2 lg:top-[13%] 2xl:-top-5">
          <Image src={heroBgPattern} alt="Hero background pattern" className="block w-full dark:hidden" priority />
          <Image src={heroBgPatternDark} alt="Hero background pattern" className="hidden w-full dark:block" priority />
        </div>
      </RevealAnimation>

      <div className="main-container relative z-10">
        <div className="mb-12 flex flex-col items-center justify-center md:mb-[72px]">

          <div className="mx-auto mt-5 mb-10 w-full max-w-6xl space-y-4 text-center md:mb-14">
            <RevealAnimation delay={0.2}>
              <h1 className="opacity-0">Transform your email marketing with AI-powered precision</h1>
            </RevealAnimation>

            <RevealAnimation delay={0.3}>
              <p className="mx-auto max-w-[652px] opacity-0">
                Supercharge your email marketing and transactional emails with AI-driven automation, unmatched
                deliverability, and real-time analytics.
              </p>
            </RevealAnimation>
          </div>
{/* 
          <ul className="hero-buttons flex flex-col gap-4 max-md:w-full md:flex-row">
            <RevealAnimation delay={0.3} direction="left" offset={50}>
              <li className="max-md: mx-auto max-md:w-[90%] md:w-auto">
                <LinkButton
                  href="/login"
                  className="btn btn-lg md:btn-xl hover:btn-secondary dark:hover:btn-white btn-primary w-full md:w-auto"
                  aria-label="Get started for free">
                  Get started for free
                </LinkButton>
              </li>
            </RevealAnimation>
            <RevealAnimation delay={0.5} direction="left" offset={50}>
              <li className="max-md:mx-auto max-md:w-[90%] md:w-auto">
                <LinkButton
                  href="/features"
                  className="btn btn-lg md:btn-xl hover:btn-primary btn-white dark:btn-white-dark w-full md:w-auto"
                  aria-label="Explore features">
                  Explore features
                </LinkButton>
              </li>
            </RevealAnimation>
          </ul> */}
        </div>

        {/* Hero Image */}
        <div className="dark:after:from-[rgba(24, 29, 38, 0.00)] relative flex items-center justify-center after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:bg-gradient-to-b after:from-[rgba(240,242,246,0.00)] after:from-[45.78%] after:to-[#F4F5F8] after:to-[87.09%] sm:gap-8 sm:after:absolute sm:after:z-40 sm:after:h-[504px] sm:after:w-[641px] sm:after:content-[''] dark:after:h-[254px] dark:after:from-[25.78%] dark:after:to-[#181D26] dark:after:to-[97.09%]">
          <div className="absolute top-[52%] left-[57%] max-sm:-translate-x-1/2 sm:left-[0%] lg:top-[24%]">
            <RevealAnimation animationType="to" direction="down" offset={10} rotation={-9} delay={0.6}>
              <article className="relative opacity-0">
                <div className="shadow-4 bg-background-1 dark:bg-background-9 border-stroke-1 dark:border-stroke-8 marketing-hero-asset-inner max-h-[188px] min-h-[188px] max-w-[250px] min-w-[250px] rounded-xl border border-dashed md:max-w-[302px] md:min-w-[302px]" />
                <div className="bg-background-1 dark:bg-background-6 shadow-4 marketing-hero-asset-content absolute inset-0 max-h-[188px] min-h-[188px] max-w-[250px] min-w-[250px] -rotate-[10deg] space-y-4 rounded-xl p-6 md:max-w-[302px] md:min-w-[302px]">
                  <div>
                    <h2 className="text-xl leading-[1.5] font-normal">E-learning website</h2>
                    <p className="text-tagline-3 flex items-center gap-1">
                      <span aria-hidden="true">
                        <ClockIcon />
                      </span>
                      15 january 2025
                    </p>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="text-tagline-3 bg-ns-yellow rounded-[4px] px-4 py-1"
                      aria-label="View design category">
                      Design
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1" aria-label="Team members">
                      <Image
                        className="inline-block size-6 rounded-full bg-linear-[156deg,#FFF_32.92%,#A585FF_91%] object-cover object-center ring-[3px] ring-white"
                        src={avatar9}
                        alt="Team member 1"
                        width={24}
                        height={24}
                        loading="lazy"
                      />
                      <Image
                        className="inline-block size-6 rounded-full bg-linear-[156deg,#FFF_32.92%,#A585FF_91%] ring-[3px] ring-white"
                        src={avatar10}
                        alt="Team member 2"
                        width={24}
                        height={24}
                        loading="lazy"
                      />
                      <Image
                        className="relative z-0 inline-block size-6 rounded-full bg-linear-[156deg,#FFF_32.92%,#A585FF_91%] ring-[3px] ring-white"
                        src={avatar11}
                        alt="Team member 3"
                        width={24}
                        height={24}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="flex items-center gap-1">
                        <span aria-hidden="true">
                          <UserIcon />
                        </span>
                        <span className="text-tagline-3 text-secondary/60 dark:text-accent/60">5</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span aria-hidden="true">
                          <MessageIcon />
                        </span>
                        <span className="text-tagline-3 text-secondary/60 dark:text-accent/60">7</span>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </RevealAnimation>
          </div>

          <div className="absolute top-[48%] right-[0%] hidden sm:block lg:top-[24%]">
            <RevealAnimation animationType="to" direction="down" offset={10} rotation={9} delay={0.2}>
              <article className="relative opacity-0">
                <div className="shadow-4 bg-background-1 dark:bg-background-9 border-stroke-1 dark:border-stroke-8 marketing-hero-asset-inner-2 max-h-[188px] min-h-[188px] max-w-[250px] min-w-[250px] rounded-xl border border-dashed md:max-w-[302px] md:min-w-[302px]" />
                <div className="bg-background-1 dark:bg-background-6 shadow-4 marketing-hero-asset-content-2 absolute inset-0 max-h-[188px] min-h-[188px] max-w-[250px] min-w-[250px] rotate-[10deg] space-y-4 rounded-xl p-4 md:max-w-[302px] md:min-w-[302px]">
                  <div>
                    <h2 className="flex items-center gap-1 text-xl leading-[1.5] font-normal">
                      <span
                        className="bg-primary-500 flex size-5 items-center justify-center rounded-full p-1"
                        aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={11} viewBox="0 0 16 11" fill="none">
                          <path
                            d="M1.48332 4.49826L3.93111 10.007L14.1693 1.65801"
                            stroke="white"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      Task begin processed
                    </h2>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="text-tagline-3 bg-ns-green rounded-[4px] px-4 py-1"
                      aria-label="View design category">
                      Design
                    </Link>
                  </div>
                  <div className="mt-12 flex items-center justify-between">
                    <p className="flex items-center gap-1">
                      <span aria-hidden="true">
                        <TaskIcon />
                      </span>
                      <span className="text-tagline-3 text-secondary/60 dark:text-accent/60">40 Task</span>
                    </p>
                    <div>
                      <Link
                        href="#"
                        className="text-tagline-3 bg-primary-500 rounded-[6px] px-2 py-1 text-white"
                        aria-label="Add new task">
                        New Tasks Add
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </RevealAnimation>
          </div>

          <RevealAnimation direction="down" offset={20} delay={0.2}>
            <figure className="w-full max-w-[572px] opacity-0">
              <Image src={heroImg} alt="Hero image showing email marketing dashboard" priority />
            </figure>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default Hero;
