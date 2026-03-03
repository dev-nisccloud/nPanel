import authorAvatarBgImg from '@public/images/ns-author-avatar-bg.png';
import avatar1Img from '@public/images/ns-avatar-1.png';
import avatar2Img from '@public/images/ns-avatar-2.png';
import avatar3Img from '@public/images/ns-avatar-3.png';
import businessGrowthCardImg from '@public/images/ns-img-366.png';
import gradient4Img from '@public/images/ns-img-496.png';
import businessGrowthCardDarkImg from '@public/images/ns-img-dark-210.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';

const OurMission = () => {
  return (
    <section className="pt-14 pb-20 md:pt-16 md:pb-28 lg:pt-[88px] lg:pb-44 xl:pt-[100px] xl:pb-[200px]">
      <div className="main-container">
        <div className="grid grid-cols-12 items-center gap-y-14 xl:gap-x-28">
          <div className="col-span-12 mx-4 lg:col-span-6 xl:mx-0">
            <div className="space-y-3">
              <RevealAnimation delay={0.1}>
                <span className="badge badge-cyan mb-5">Our Mission</span>
              </RevealAnimation>
              <RevealAnimation delay={0.2}>
                <h2>Empowering teams to collaborate and thrive with intelligent</h2>
              </RevealAnimation>
              <RevealAnimation delay={0.4}>
                <p>
                  In today&apos;s fast-paced, digitally connected world, successful teams rely on more than just
                  talent—they thrive on intelligent collaboration.
                </p>
              </RevealAnimation>
            </div>
          </div>
          {/*  */}
          <div className="relative col-span-12 mx-4 lg:col-span-6 xl:mx-0">
            {/* Business Growth Card */}
            <RevealAnimation delay={0.5} useSpring={true} duration={2.5}>
              <figure className="absolute top-[78%] left-1/2 z-20 max-w-[360px] -translate-x-1/2 overflow-hidden rounded-[12px]">
                <Image
                  src={businessGrowthCardImg}
                  alt="business growth card"
                  className="block h-full w-full dark:hidden"
                />
                <Image
                  src={businessGrowthCardDarkImg}
                  alt="business growth card"
                  className="hidden h-full w-full dark:block"
                />
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.6}>
              <div className="dark:bg-background-8 shadow-2 relative z-10 flex h-full min-h-[380px] items-center justify-center overflow-hidden rounded-[20px] bg-white/60 p-[26px] backdrop-blur-[20px]">
                {/* gradient bg */}
                <RevealAnimation delay={0.7}>
                  <figure className="pointer-events-none absolute right-[-33%] bottom-[-54%] -z-10 w-full max-w-[500px] rotate-180 select-none max-[376px]:bottom-[-45%] md:right-[-30%] md:bottom-[-112%] md:max-w-[700px] lg:bottom-[-80%] xl:right-[-32%] xl:bottom-[-90%]">
                    <Image src={gradient4Img} alt="hero author bg" className="size-full object-cover" />
                  </figure>
                </RevealAnimation>
                <div className="-mt-20 text-center">
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <div className="group flex -space-x-3.5">
                      <figure className="relative inline-block size-11 overflow-hidden rounded-full bg-linear-[156deg,_#FFF_32.92%,_#A585FF_91%] ring-3 ring-white">
                        <Image src={avatar1Img} alt="avatar" className="max-w-full" />
                        <Image src={authorAvatarBgImg} alt="avatar" className="absolute top-0 left-0 -z-10" />
                      </figure>
                      <figure className="relative inline-block size-11 overflow-hidden rounded-full bg-linear-[156deg,_#FFF_32.92%,_#A585FF_91%] ring-3 ring-white">
                        <Image src={avatar2Img} alt="avatar" className="max-w-full" />
                        <Image src={authorAvatarBgImg} alt="avatar" className="absolute top-0 left-0 -z-10" />
                      </figure>
                      <figure className="relative inline-block size-11 overflow-hidden rounded-full bg-linear-[156deg,_#FFF_32.92%,_#A585FF_91%] ring-3 ring-white">
                        <Image src={avatar3Img} alt="avatar" className="max-w-full" />
                        <Image src={authorAvatarBgImg} alt="avatar" className="absolute top-0 left-0 -z-10" />
                      </figure>
                      <div className="text-secondary/80 bg-ns-yellow text-tagline-3 relative z-10 inline-flex size-12 items-center justify-center overflow-hidden rounded-full font-medium ring-3 ring-white">
                        <svg
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group-hover:translate-x-8 group-hover:-translate-y-12">
                          <path
                            d="M6 18L18 6"
                            stroke="#1A1A1C"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.25 6H18V15.75"
                            stroke="#1A1A1C"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {/*  */}
                        <svg
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute -translate-x-12 translate-y-6 transition-all duration-500 group-hover:-translate-x-[1px] group-hover:-translate-y-[2%]">
                          <path
                            d="M6 18L18 6"
                            stroke="#1A1A1C"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.25 6H18V15.75"
                            stroke="#1A1A1C"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h6 className="text-secondary dark:text-accent leading-[1 .5] mb-1 text-xl font-normal">
                    20k+ global investment
                  </h6>
                  <p className="text-secondary/60 dark:text-accent/60">Get Global Investment policy in the year</p>
                </div>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

OurMission.displayName = 'OurMission';
export default OurMission;
