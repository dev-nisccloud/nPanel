import { IService } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import newArrowWhite from '@public/images/icons/new-arrow-white.svg';
import service03 from '@public/images/ns-img-318.png';
import Image from 'next/image';
import Link from 'next/link';
import RevealAnimation from '../animation/RevealAnimation';
import BeforeAfterServiceImg from './BeforeAfterServiceImg';

const AITools = () => {
  const aiTools = getMarkDownData<IService & { [key: string]: unknown }>('src/data/services').filter(
    (aiTools) => aiTools.showHomePage === true,
  );

  return (
    <section className="mt-10 overflow-hidden py-6 md:py-6 lg:py-6 xl:py-6">
      <div className="main-container">
        <div className="mb-11 text-center lg:mx-auto lg:mb-9 lg:max-w-[730px]">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-green">AI Tools</span>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <h2 className="mb-1 md:mb-3">Your Business Deserves to Stand Out — We Make It Happen.</h2>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <p className="lg:mx-auto lg:max-w-[530px]">
              From fast hosting and professional email to AI-powered branding and 360° digital marketing — everything you need to grow, all in one place.
            </p>
          </RevealAnimation>
        </div>
        {/* services cards */}
        <div className="grid grid-cols-12 gap-y-6 md:gap-6">
          {/* service card 01 */}
          <RevealAnimation delay={0.1}>
            <div className="group/card-img col-span-12">
              <div className="bg-background-12 border-background-12 grid h-full md:h-[420px] grid-cols-12 gap-y-6 overflow-hidden rounded-4xl border px-5 pt-8 md:gap-6 md:px-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 pb-9 md:col-span-5 lg:col-span-3">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[6]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[6]?.description}</p>
                  </blockquote>
                  <Link
                    href={`services/${aiTools[6].slug || ''}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto w-full max-w-[905px] overflow-hidden rounded-t-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-7 md:rounded-t-[20px] lg:col-span-9">
                  <Image
                    src={aiTools[6]?.image}
                    width={905}
                    height={400}
                    alt="services"
                    className="h-full w-full object-cover"
                  />
                </figure>
              </div>
            </div>
          </RevealAnimation>
          {/* service card 02 */}
          <RevealAnimation delay={0.2} direction="left">
            <div className="group/card-img col-span-12 lg:col-span-6">
              <div className="bg-background-12 border-background-12 grid h-full grid-cols-12 gap-y-16 rounded-3xl border p-5 md:gap-6 md:p-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 md:col-span-6">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[0]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[0]?.description}</p>
                  </blockquote>
                  <Link
                    href={`/services/${aiTools[0].slug}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto h-[360px] w-full max-w-[905px] overflow-hidden rounded-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-6 md:h-full md:rounded-[20px]">
                  <Image
                    src={aiTools[0]?.image}
                    width={292}
                    height={412}
                    alt="services"
                    className="h-full w-full object-cover"
                  />
                </figure>
              </div>
            </div>
          </RevealAnimation>
          {/* service card 03 */}
          <BeforeAfterServiceImg service={aiTools[5]} />
          {/* service card 04 */}
          <RevealAnimation delay={0.1} direction="left">
            <div className="group/card-img col-span-12 lg:col-span-6">
              <div className="bg-background-12 border-background-12 grid h-full grid-cols-12 gap-y-16 rounded-3xl border p-5 md:gap-6 md:p-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 md:col-span-6">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[7]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[7]?.description}</p>
                  </blockquote>
                  <Link
                    href={`/services/${aiTools[7].slug}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto h-[360px] w-full max-w-[905px] overflow-hidden rounded-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-6 md:h-full md:rounded-[20px]">
                  <Image src={service03} alt="services" className="h-full w-full object-cover" />
                </figure>
              </div>
            </div>
          </RevealAnimation>
          {/* service card 05 */}
          <RevealAnimation delay={0.2} direction="right">
            <div className="group/card-img col-span-12 lg:col-span-6">
              <div className="bg-background-12 border-background-12 grid h-full grid-cols-12 gap-y-16 rounded-3xl border p-5 md:gap-6 md:p-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 md:col-span-6">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[4]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[4]?.description}</p>
                  </blockquote>
                  <Link
                    href={`/services/${aiTools[4].slug}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto h-[360px] w-full max-w-[905px] overflow-hidden rounded-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-6 md:h-full md:rounded-[20px]">
                  <Image
                    src={aiTools[4]?.image}
                    width={292}
                    height={412}
                    alt="services"
                    className="h-full w-full object-cover"
                  />
                </figure>
              </div>
            </div>
          </RevealAnimation>
          {/* service card 06 */}
          <RevealAnimation delay={0.1} direction="left">
            <div className="group/card-img col-span-12 lg:col-span-6">
              <div className="bg-background-12 border-background-12 grid h-full grid-cols-12 gap-y-16 rounded-3xl border p-5 md:gap-6 md:p-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 md:col-span-6">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[1]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[1]?.description}</p>
                  </blockquote>
                  <Link
                    href={`/services/${aiTools[1].slug}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto h-[360px] w-full max-w-[905px] overflow-hidden rounded-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-6 md:h-full md:rounded-[20px]">
                  <Image
                    src={aiTools[1]?.image}
                    width={292}
                    height={412}
                    alt="services"
                    className="h-full w-full object-cover"
                  />
                </figure>
              </div>
            </div>
          </RevealAnimation>
          {/* service card 07 */}
          <RevealAnimation delay={0.2} direction="right">
            <div className="group/card-img col-span-12 lg:col-span-6">
              <div className="bg-background-12 border-background-12 grid h-full grid-cols-12 gap-y-16 rounded-3xl border p-5 md:gap-6 md:p-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 md:col-span-6">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[3]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[3]?.description}</p>
                  </blockquote>
                  <Link
                    href={`/services/${aiTools[3].slug}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto h-[360px] w-full max-w-[905px] overflow-hidden rounded-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-6 md:h-full md:rounded-[20px]">
                  <Image
                    src={aiTools[3]?.image}
                    width={292}
                    height={412}
                    alt="services"
                    className="h-full w-full object-cover"
                  />
                </figure>
              </div>
            </div>
          </RevealAnimation>
          {/* service card 08 */}
          <RevealAnimation delay={0.1}>
            <div className="group/card-img col-span-12">
              <div className="bg-background-12 border-background-12 grid h-full md:h-[420px] grid-cols-12 gap-y-6 overflow-hidden rounded-4xl border px-5 pt-8 md:gap-6 md:px-8">
                <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 pb-9 md:col-span-5 lg:col-span-3">
                  <blockquote className="space-y-2">
                    <h3 className="text-heading-5 md:text-heading-4 line-clamp-2">{aiTools[2]?.title}</h3>
                    <p className="text-tagline-1 text-secondary/60 line-clamp-4">{aiTools[2]?.description}</p>
                  </blockquote>
                  <Link
                    href={`/services/${aiTools[2].slug}`}
                    className="hover:bg-primary-500 group bg-secondary relative flex h-10 w-18 items-center justify-center space-y-5 overflow-hidden rounded-[40px] p-4 ring-8 ring-white transition-all duration-500 ease-in-out md:h-13 md:w-22 md:p-5">
                    <figure className="relative size-6 items-center justify-center overflow-hidden">
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="absolute inset-0 size-full -translate-x-6 object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-1"
                      />
                      <Image
                        src={newArrowWhite}
                        alt="new-arrow"
                        className="size-full object-cover transition-transform duration-400 ease-in-out group-hover:translate-x-6"
                      />
                    </figure>
                  </Link>
                </aside>
                <figure className="col-span-12 mx-auto w-full max-w-[905px] overflow-hidden rounded-t-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-7 md:rounded-t-[20px] lg:col-span-9">
                  <Image
                    src={aiTools[2]?.image}
                    width={905}
                    height={400}
                    alt="services"
                    className="h-full w-full object-cover"
                  />
                </figure>
              </div>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

AITools.displayName = 'AITools';
export default AITools;
