import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';
import { StarIcon } from '@/icons';
import avatar1Img from '@public/images/ns-avatar-1.png';
import avatar2Img from '@public/images/ns-avatar-2.png';
import avatar3Img from '@public/images/ns-avatar-3.png';
import arrowUpRightLight from '@public/images/icons/arrow-up-right-light.svg';
import arrowUpRight from '@public/images/icons/arrow-up-right.svg';
import hero from '@public/images/ns-img-98.svg';
import heroChart from '@public/images/ns-img-99.svg';
import heroDark from '@public/images/ns-img-dark-71.svg';
import Image from 'next/image';
import HeroCardImg from './HeroCardImg';
import Link from 'next/link';
import Clients from './Clients';

const Hero = () => {
  return (
    <RevealAnimation delay={0.1} instant>
      <section
        className="mx-[8px] mt-[8px] h-[830px] overflow-hidden rounded-2xl bg-linear-to-b from-[#142e6e] to-[#edf2ff] max-[376px]:h-[850px] sm:h-[920px] md:rounded-3xl lg:h-[1078px] lg:rounded-4xl xl:rounded-[56px]"
        aria-label="Hero section - Financial management platform introduction">
        <div className="main-container">
          <div className="relative pt-[160px] lg:pt-[206px]">
            <div className="flex items-center justify-center gap-x-14">
              {/* text content  */}
              <div className="space-y-13 lg:space-y-16 xl:space-y-19">
                {/* content  */}
                <div className="space-y-8">
                  {/* avatar group  */}
                  {/* <div className="flex items-center justify-center gap-x-3" aria-label="User testimonials">
                    <div className="flex items-center justify-center -space-x-3.5" aria-label="User avatars">
                      <RevealAnimation delay={0.1} direction="left" offset={50} instant>
                        <figure className="size-[50px] overflow-hidden rounded-full bg-[#FFC5C5] ring-2 ring-white">
                          <Image
                            src={avatar1Img}
                            alt="User avatar representing a satisfied customer"
                            width={50}
                            height={50}
                            className="size-full object-cover"
                            itemProp="image"
                          />
                        </figure>
                      </RevealAnimation>
                      <RevealAnimation delay={0.2} direction="left" offset={50} instant>
                        <figure className="size-[50px] overflow-hidden rounded-full bg-[#DBD6FF] ring-2 ring-white">
                          <Image
                            src={avatar2Img}
                            alt="User avatar representing a satisfied customer"
                            width={50}
                            height={50}
                            className="size-full object-cover"
                            itemProp="image"
                          />
                        </figure>
                      </RevealAnimation>
                      <RevealAnimation delay={0.3} direction="left" offset={50} instant>
                        <figure className="size-[50px] overflow-hidden rounded-full bg-[#EED0BF] ring-2 ring-white">
                          <Image
                            src={avatar3Img}
                            alt="User avatar representing a satisfied customer"
                            width={50}
                            height={50}
                            className="size-full object-cover"
                            itemProp="image"
                          />
                        </figure>
                      </RevealAnimation>
                    </div>
                    <RevealAnimation delay={0.4} direction="right" offset={50} instant>
                      <p
                        className="text-tagline-2 max-w-[90px] font-normal text-white/80"
                        itemProp="aggregateRating"
                        itemType="https://schema.org/AggregateRating">
                        <span itemProp="ratingCount">10,000+</span> people joined
                      </p>
                    </RevealAnimation>
                  </div> */}
                  {/* text  */}
                  <div className="space-y-3 text-center">
                    <RevealAnimation delay={0.5} instant>
                      <h1 className="mx-auto max-w-[780px] font-medium text-white" itemProp="headline">
                        Launch Your Business Online in Minutes.
                      </h1>
                    </RevealAnimation>
                    <RevealAnimation delay={0.6} instant>
                      <p
                        className="text-accent/80 mx-auto max-w-[620px] text-lg leading-[150%] font-normal lg:max-w-[682px]"
                        itemProp="description">
                        Fast Hosting, Professional Emails, and AI-Powered Marketing Tools. Everything you need to grow, all in one place.
                      </p>
                    </RevealAnimation>
                  </div>
                </div>
                {/* btns  */}
                {/* <div
                  className="flex flex-col items-center justify-center gap-y-4 md:flex-row md:gap-x-4 md:gap-y-0"
                  aria-label="Call to action buttons">
                  <RevealAnimation delay={0.7} direction="left" offset={50} instant>
                    <div className="w-[80%] text-center sm:w-auto md:mx-0 md:w-auto">
                      <LinkButton href="/pricing" className="btn-v3-lg btn-v3-white w-full sm:w-auto">
                        Get started
                      </LinkButton>
                    </div>
                  </RevealAnimation>
                  <RevealAnimation delay={0.8} direction="left" offset={50} instant>
                    <div className="w-[80%] text-center sm:w-auto md:mx-0 md:w-auto">
                      <LinkButton
                        href="/contact-us"
                        className="btn-v3-lg btn-v3-white bg-secondary/20 w-full text-white backdrop-blur-[2px] sm:w-auto">
                        Book a Demo
                      </LinkButton>
                    </div>
                  </RevealAnimation>
                </div> */}
              </div>
            </div>

            <div className="relative z-10 mt-10 lg:mt-16 xl:mt-20">
              <div className="main-container">
                <div className="flex flex-col items-center gap-8 sm:flex-row lg:gap-12 2xl:gap-16">
                  <div className="w-full max-w-full space-y-8 min-[550px]:w-[80%] sm:w-full sm:max-w-[350px] 2xl:max-w-[389px]">
                    <RevealAnimation delay={0.7} duration={2} useSpring={true} instant={true}>
                      <figure className="dark:bg-background-8 dark:border-stroke-6 border-stroke-4 flex items-center justify-center gap-4 rounded-full border bg-white px-6 py-5 2xl:px-8 2xl:py-[22px]">
                        <div className="space-y-1">
                          <div className="bg-ns-green mx-auto flex size-12 items-center justify-center rounded-full xl:size-14 2xl:size-16">
                            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 32 32" fill="none">
                              <path
                                d="M5 13.3333V6C5 5.73478 5.10536 5.48043 5.29289 5.29289C5.48043 5.10536 5.73478 5 6 5H26C26.2652 5 26.5196 5.10536 26.7071 5.29289C26.8946 5.48043 27 5.73478 27 6V13.3333C27 23.8353 18.0868 27.3146 16.307 27.9047C16.1081 27.9731 15.8919 27.9731 15.693 27.9047C13.9133 27.3146 5 23.8353 5 13.3333Z"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p className="text-secondary dark:text-accent xl:text-tagline-2 text-tagline-3 hidden text-center font-normal min-[407px]:block sm:hidden xl:block">
                            99.9% Uptime
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-ns-cyan mx-auto flex size-12 items-center justify-center rounded-full xl:size-14 2xl:size-16">
                            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 32 32" fill="none">
                              <path
                                d="M21.9996 16C22.0045 19.9099 21.2429 23.7828 19.7578 27.3997"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M20.4694 11.9996C19.6592 11.094 18.5932 10.4557 17.4124 10.1692C16.2315 9.88267 14.9915 9.96143 13.8564 10.3951C12.7213 10.8287 11.7446 11.5967 11.0555 12.5976C10.3665 13.5984 9.99752 14.7849 9.99751 16C10.0022 19.0494 9.22865 22.0496 7.75 24.7165"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 4.68285C13.8103 4.04483 15.7471 3.85003 17.6481 4.1148C19.5492 4.37956 21.3591 5.09617 22.9261 6.20456C24.4932 7.31295 25.7717 8.78082 26.6545 10.4852C27.5373 12.1895 27.9987 14.0806 28.0001 16C28.0017 18.6916 27.7025 21.3749 27.108 23.9999"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M2.91406 21.003C3.63335 19.4344 4.00455 17.7287 4.00215 16.003C4.00024 14.3143 4.35565 12.6443 5.04504 11.1028C5.73443 9.56123 6.74219 8.18298 8.00212 7.05859"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M13.8207 26C13.5671 26.5524 13.2936 27.0931 13 27.6223"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.9983 16C15.9998 18.0239 15.7457 20.0398 15.2422 22"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p className="text-secondary dark:text-accent xl:text-tagline-2 text-tagline-3 hidden text-center font-normal min-[407px]:block sm:hidden xl:block">
                            Free SSL
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-primary-200 mx-auto flex size-12 items-center justify-center rounded-full xl:size-14 2xl:size-16">
                            <svg xmlns="http://www.w3.org/2000/svg" width={33} height={32} viewBox="0 0 33 32" fill="none">
                              <path
                                d="M16.5 20C17.8807 20 19 18.8807 19 17.5C19 16.1193 17.8807 15 16.5 15C15.1193 15 14 16.1193 14 17.5C14 18.8807 15.1193 20 16.5 20Z"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M16.5 20V23"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M26.5 11H6.5C5.94772 11 5.5 11.4477 5.5 12V26C5.5 26.5523 5.94772 27 6.5 27H26.5C27.0523 27 27.5 26.5523 27.5 26V12C27.5 11.4477 27.0523 11 26.5 11Z"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 11V6.5C12 5.30653 12.4741 4.16193 13.318 3.31802C14.1619 2.47411 15.3065 2 16.5 2C17.6935 2 18.8381 2.47411 19.682 3.31802C20.5259 4.16193 21 5.30653 21 6.5V11"
                                stroke="#1A1A1C"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p className="text-secondary dark:text-accent text-tagline-2 hidden text-center font-normal min-[407px]:block sm:hidden xl:block">
                            Secure by default
                          </p>
                        </div>
                      </figure>
                    </RevealAnimation>
                    <RevealAnimation delay={0.8} direction="left" offset={100} duration={2} useSpring={true} instant={true}>
                      <figure className="dark:bg-background-8 dark:border-stroke-6 border-stroke-4 flex items-center justify-between gap-4 rounded-full border bg-white px-6 py-6 2xl:p-8 2xl:py-8">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <p className="text-secondary text-heading-5 dark:text-accent font-normal">5.0</p>
                            <span className="size-[25px]">
                              <StarIcon className="fill-ns-green" />
                            </span>
                          </div>
                          <p className="block sm:hidden xl:block">4k users reviews</p>
                        </div>
                        <div>
                          <Link
                            href="#"
                            className="bg-secondary dark:bg-accent group relative flex size-12 items-center justify-center overflow-hidden rounded-full 2xl:size-14">
                            {/* light Icon */}
                            <Image
                              src={arrowUpRightLight}
                              alt="Arrow Icon"
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 transition-all duration-500 group-hover:inline group-hover:translate-x-8 group-hover:-translate-y-12 dark:hidden"
                            />
                            <Image
                              src={arrowUpRightLight}
                              alt="Arrow Icon"
                              className="absolute inline -translate-x-12 translate-y-6 transition-all duration-500 group-hover:-translate-x-[0px] group-hover:-translate-y-[7%] group-hover:opacity-100 dark:hidden"
                            />
                            {/* dark Icon */}
                            <Image
                              src={arrowUpRight}
                              alt="Arrow Icon"
                              className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 opacity-100 transition-all duration-500 group-hover:translate-x-8 group-hover:-translate-y-12 dark:inline group-hover:dark:inline"
                            />
                            <Image
                              src={arrowUpRight}
                              alt="Arrow Icon"
                              className="absolute hidden -translate-x-12 translate-y-6 transition-all duration-500 group-hover:-translate-x-[0px] group-hover:-translate-y-[7%] group-hover:opacity-100 dark:inline"
                            />
                          </Link>
                        </div>
                      </figure>
                    </RevealAnimation>
                  </div>
                  <RevealAnimation delay={0.4} direction="up">
                    <div className="hidden lg:block">
                      <figure className="max-w-[380px] overflow-hidden rounded-[20px] xl:max-w-[420px] 2xl:max-w-[497px]">
                        <Image src={hero} alt="hero" className="size-full object-cover dark:hidden" />
                        <Image src={heroDark} alt="hero-dark" className="hidden size-full object-cover dark:block" />
                      </figure>
                    </div>
                  </RevealAnimation>
                  <div className="w-full max-w-full space-y-8 min-[550px]:w-[80%] sm:w-full sm:max-w-[389px]">
                    <RevealAnimation
                      delay={0.7}
                      direction="right"
                      offset={100}
                      duration={2}
                      useSpring={true}
                      instant={true}>
                      <figure className="dark:bg-background-8 dark:border-stroke-6 border-stroke-4 flex items-center justify-between gap-4 rounded-full border bg-white p-5 sm:justify-center 2xl:p-6">
                        <div>
                          <p className="xl:text-tagline-1 text-tagline-2">Security incidents</p>
                          <p className="2xl:text-heading-6 text-tagline-1 text-secondary dark:text-accent block font-normal sm:hidden xl:block">
                            Neutralized
                          </p>
                        </div>
                        <div>
                          <figure>
                            <Image src={heroChart} alt="hero chart" className="w-full" />
                          </figure>
                        </div>
                      </figure>
                    </RevealAnimation>
                    <RevealAnimation
                      delay={0.8}
                      direction="right"
                      offset={100}
                      duration={2}
                      useSpring={true}
                      instant={true}>
                      <figure className="dark:bg-background-8 dark:border-stroke-6 border-stroke-4 flex w-full max-w-full items-center justify-between rounded-full border bg-white px-5 py-4 2xl:py-6">
                        <div>
                          <p className="xl:text-tagline-1 text-tagline-2">Data encryption</p>
                          <p className="xl:text-heading-6 text-tagline-1 text-secondary dark:text-accent block font-medium sm:hidden lg:block">
                            100%
                          </p>
                        </div>
                        <div>
                          <div className="bg-secondary flex size-[52px] items-center justify-center rounded-full">
                            <div className="flex items-end gap-1.5">
                              <div className="h-[18px] w-[3px] rounded-full bg-white" />
                              <div className="h-[26px] w-[3px] rounded-full bg-white" />
                              <div className="h-3 w-[3px] rounded-full bg-white" />
                            </div>
                          </div>
                        </div>
                      </figure>
                    </RevealAnimation>
                  </div>
                </div>
              </div>
            </div>

            <Clients />
            {/* credit card round img  */}
            {/* <RevealAnimation delay={0.9} instant>
              <HeroCardImg />
            </RevealAnimation> */}
          </div>
        </div>
      </section>
    </RevealAnimation>
  );
};

Hero.displayName = 'Hero';
export default Hero;
