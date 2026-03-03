import confluence from '@public/images/icons/confluence.svg';
import edge from '@public/images/icons/edge.svg';
import figma from '@public/images/icons/figma.svg';
import framer from '@public/images/icons/framer.svg';
import gmail from '@public/images/icons/gmail.svg';
import googleMeet from '@public/images/icons/google-meet.svg';
import google from '@public/images/icons/google.svg';
import marvel from '@public/images/icons/marvel.svg';
import microsoft from '@public/images/icons/microsoft.svg';
import msYammer from '@public/images/icons/ms_yammer.svg';
import slack from '@public/images/icons/slack.svg';
import snapchat from '@public/images/icons/snapchat.svg';
import vlWhite from '@public/images/icons/vl-white.svg';
import vl from '@public/images/icons/vl.svg';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const Integration = () => {
  return (
    <section className="pt-32 pb-20 sm:pt-36 md:pt-42 md:pb-28 lg:pb-44 xl:pt-[180px] xl:pb-[200px]">
      <RevealAnimation delay={0.1} offset={80}>
        <div className="dark:bg-background-6 relative z-10 mx-auto w-[95%] rounded-4xl bg-white px-10 py-[70px] md:min-h-[740px] md:px-[75px] 2xl:max-w-[1440px]">
          <div className="relative z-10 mx-auto w-fit max-w-[410px] text-center lg:mt-20">
            <RevealAnimation delay={0.2}>
              <h2 className="mb-3">
                Effortless app <br className="hidden lg:block" />
                integration.
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <p className="mb-14">
                Seamlessly connect your favorite tools and platforms without the usual hassle. Our solution is designed
                to make
              </p>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <div>
                <LinkButton href="/pricing" className="btn-v3-lg btn-v3-secondary mx-auto">
                  See it in Action
                </LinkButton>
              </div>
            </RevealAnimation>
          </div>
          <div className="bottom-0 left-5 hidden lg:absolute lg:top-0 lg:bottom-auto lg:left-10 lg:block lg:w-1/2 lg:max-w-[400px] xl:left-20 2xl:left-0 2xl:max-w-[582px]">
            <div className="relative flex h-full flex-row flex-wrap gap-5 py-10 lg:flex-col lg:gap-[40px] lg:py-[70px] 2xl:pl-[70px]">
              <RevealAnimation delay={0.4}>
                <div className="flex gap-5 lg:ml-[60px] lg:gap-8 xl:ml-[100px] xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={googleMeet} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>
              <RevealAnimation delay={0.5}>
                <div className="flex gap-5 lg:gap-8 lg:self-start xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={gmail} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={marvel} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.6}>
                <div className="flex gap-5 lg:ml-[60px] lg:gap-8 xl:ml-[100px] xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={confluence} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={framer} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>
              <RevealAnimation delay={0.7}>
                <div className="flex gap-5 lg:ml-[100px] lg:gap-8 xl:ml-[185px] xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={vl} className="size-full dark:hidden" alt="integration icon" />
                      <Image src={vlWhite} className="hidden size-full dark:block" alt="integration icon" />
                    </div>
                  </figure>
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={edge} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>
            </div>
          </div>
          <div className="right-5 bottom-0 hidden lg:absolute lg:top-0 lg:right-10 lg:bottom-auto lg:block lg:w-1/2 lg:max-w-[400px] xl:right-28 2xl:right-0 2xl:max-w-[582px]">
            <div className="relative flex h-full flex-row flex-wrap gap-5 py-10 lg:flex-col lg:gap-[40px] lg:py-[70px] 2xl:pr-[70px]">
              <RevealAnimation delay={0.4}>
                <div className="flex lg:mr-[60px] lg:self-end xl:mr-[100px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={confluence} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.5}>
                <div className="flex gap-8 lg:gap-[50px] lg:self-end xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={slack} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={snapchat} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.6}>
                <div className="flex gap-8 lg:mr-[60px] lg:gap-[50px] lg:self-end xl:mr-[100px] xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={google} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={msYammer} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>

              <RevealAnimation delay={0.7}>
                <div className="flex gap-8 self-end lg:mr-[100px] lg:gap-[50px] xl:mr-[185px] xl:gap-[75px]">
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={microsoft} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                  <figure className="bg-background-2 dark:bg-background-7 flex size-[100px] items-center justify-center rounded-full 2xl:size-[120px]">
                    <div className="dark:bg-background-8 size-[80px] rounded-full bg-white p-6 2xl:size-[100px]">
                      <Image src={figma} className="size-full" alt="integration icon" />
                    </div>
                  </figure>
                </div>
              </RevealAnimation>
            </div>
          </div>

          {/* mobile view  */}
          <div className="integration-list-1 mt-8 flex flex-wrap items-center justify-center gap-4 px-6 sm:px-10 md:mt-20 lg:hidden">
            <RevealAnimation delay={0.4}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={googleMeet} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={gmail} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>

            <RevealAnimation delay={0.4}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={marvel} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.4}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={confluence} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.5}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={framer} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.5}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={vl} className="size-full dark:hidden" alt="integration icon" />
                  <Image src={vlWhite} className="hidden size-full dark:block" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>

            <RevealAnimation delay={0.5}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={edge} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>

            <RevealAnimation delay={0.5}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={confluence} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>

            <RevealAnimation delay={0.6}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={slack} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.6}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={snapchat} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.6}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={google} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.6}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={msYammer} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>

            <RevealAnimation delay={0.7}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={microsoft} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
            <RevealAnimation delay={0.7}>
              <figure className="bg-background-2 dark:bg-background-7 flex size-14 items-center justify-center rounded-full sm:size-[75px]">
                <div className="dark:bg-background-6 size-10 rounded-full bg-white p-2 sm:size-[60px]">
                  <Image src={figma} className="size-full" alt="integration icon" />
                </div>
              </figure>
            </RevealAnimation>
          </div>
        </div>
      </RevealAnimation>
    </section>
  );
};

export default Integration;
