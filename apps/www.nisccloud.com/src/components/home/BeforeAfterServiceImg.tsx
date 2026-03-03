'use client';

import { IService } from '@/interface';
import newArrowWhite from '@public/images/icons/new-arrow-white.svg';
import beforeImage from '@public/images/ns-img-316.png';
import afterImage from '@public/images/ns-img-317.png';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { useBeforeAfterImageSlider } from '../../hooks/useBeforeAfterImageSlider';
import RevealAnimation from '../animation/RevealAnimation';

// Define props interface for reusability
interface BeforeAfterServiceImgProps {
  beforeImage?: string | StaticImageData;
  afterImage?: string | StaticImageData;
  service?: IService;
  // Slider props
  initialPosition?: number;
  onPositionChange?: (percentage: number) => void;
  enableKeyboard?: boolean;
  enableClickToPosition?: boolean;
}

const BeforeAfterServiceImg = ({
  service,
  beforeImage: beforeImg = beforeImage,
  afterImage: afterImg = afterImage,

  initialPosition = 50,
  onPositionChange,
  enableKeyboard = true,
  enableClickToPosition = true,
}: BeforeAfterServiceImgProps) => {
  // Use the reusable hook
  const { sliderRef, handleRef, afterImageRef } = useBeforeAfterImageSlider({
    onPositionChange,
    initialPosition,
    enableKeyboard,
    enableClickToPosition,
  });

  return (
    <RevealAnimation delay={0.3} direction="right">
      <div className="group/card-img col-span-12 lg:col-span-6">
        <div className="bg-background-12 border-background-12 grid h-full grid-cols-12 gap-y-16 rounded-3xl border p-5 md:gap-6 md:p-8">
          <aside className="col-span-12 flex flex-col justify-between space-y-5 pt-14 md:col-span-6">
            <blockquote className="space-y-2">
              <h3 className="text-heading-5 md:text-heading-4">{service?.title}</h3>
              <p className="text-tagline-1 text-secondary/60">{service?.description}</p>
            </blockquote>
            <Link
              href={`/services/${service?.slug}`}
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
          {/* Before & After Image Slider */}
          <figure className="col-span-12 mx-auto w-full overflow-hidden rounded-lg transition-transform duration-500 ease-in-out group-hover/card-img:scale-105 md:col-span-6 md:rounded-[20px]">
            <div className="relative mx-auto h-full w-full max-w-full overflow-hidden rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] select-none md:max-w-[312px]">
              <div ref={sliderRef} className="slider relative h-full w-full cursor-ew-resize max-lg:h-100">
                <Image
                  src={beforeImg}
                  alt="Before Image"
                  className="before pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
                />
                <Image
                  ref={afterImageRef}
                  src={afterImg}
                  alt="After Image"
                  className="after pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
                />
                <div
                  ref={handleRef}
                  className="slider-handle absolute top-0 left-1/2 z-30 h-full w-1 -translate-x-1/2 transition-all duration-200 ease-in-out">
                  <div className="handle-line bg-stroke-1 absolute top-0 left-1/2 h-full w-px -translate-x-1/2" />
                  <div
                    className="absolute top-1/2 left-1/2 h-[267px] w-20 -translate-x-1/2 -translate-y-1/2 blur-[30px]"
                    style={{ background: 'var(--color-gradient-12)' }}
                  />
                  <div className="handle-circle ring-background-9/50 absolute top-1/2 left-1/2 flex h-[30px] w-[17px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[10px] rounded-[40px] bg-white px-[1px] py-[7px] ring-2 backdrop-blur-[17px] transition-all duration-200 ease-in-out hover:scale-105 hover:bg-white/90 active:scale-110 md:h-[28px] md:w-[15px] md:py-[6px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width={15} height={16} viewBox="0 0 15 16" fill="none">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.625 2.6668C8.625 3.32954 8.12132 3.8668 7.5 3.8668C6.87868 3.8668 6.375 3.32954 6.375 2.6668C6.375 2.00406 6.87868 1.4668 7.5 1.4668C8.12132 1.4668 8.625 2.00406 8.625 2.6668ZM8.625 8.00013C8.625 8.66287 8.12132 9.20013 7.5 9.20013C6.87868 9.20013 6.375 8.66287 6.375 8.00013C6.375 7.33739 6.87868 6.80013 7.5 6.80013C8.12132 6.80013 8.625 7.33739 8.625 8.00013ZM7.5 14.5335C8.12132 14.5335 8.625 13.9962 8.625 13.3335C8.625 12.6707 8.12132 12.1335 7.5 12.1335C6.87868 12.1335 6.375 12.6707 6.375 13.3335C6.375 13.9962 6.87868 14.5335 7.5 14.5335Z"
                        fill="black"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </RevealAnimation>
  );
};

BeforeAfterServiceImg.displayName = 'BeforeAfterServiceImg';
export default BeforeAfterServiceImg;
