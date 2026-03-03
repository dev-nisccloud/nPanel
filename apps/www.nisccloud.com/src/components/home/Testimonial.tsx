'use client';

import RevealAnimation from '@/components/animation/RevealAnimation';
import avatar28 from '@public/images/ns-avatar-28.png';
import avatar29 from '@public/images/ns-avatar-29.png';
import avatar30 from '@public/images/ns-avatar-30.png';
import avatar31 from '@public/images/ns-avatar-31.png';
import avatar33 from '@public/images/ns-avatar-33.png';
import avatar34 from '@public/images/ns-avatar-34.png';
import avatar35 from '@public/images/ns-avatar-35.png';
import avatar36 from '@public/images/ns-avatar-36.png';
import { StaticImageData } from 'next/image';
import { useEffect, useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import TestimonialCard from './TestimonialCard';

interface TestimonialData {
  title: string;
  description: string;
  name: string;
  designation: string;
  avatar: StaticImageData;
}

const testimonials: TestimonialData[] = [
  {
    title: 'Improved Cash Flow Management',
    description:
      '"NexTSaaS completely transformed how we manage our cash flow. The dashboards are clear, automation saves us hours each week, and our team finally has full visibility into every financial movement across the company."',
    name: 'David K.',
    designation: 'CFO',
    avatar: avatar28,
  },
  {
    title: 'Streamlined Financial Reporting',
    description:
      '"The reporting features are incredible. We can now generate comprehensive financial reports in minutes instead of days. The real-time analytics help us make data-driven decisions faster than ever before."',
    name: 'Sarah M.',
    designation: 'Financial Controller',
    avatar: avatar29,
  },
  {
    title: 'Enhanced Budget Planning',
    description:
      '"Budget planning used to be a nightmare with spreadsheets. NexTSaaS made it seamless. We can create, track, and adjust budgets in real-time, and the forecasting tools are incredibly accurate."',
    name: 'Michael R.',
    designation: 'Finance Director',
    avatar: avatar30,
  },
  {
    title: 'Automated Invoice Processing',
    description:
      '"Invoice processing automation has been a game-changer. We\'ve reduced processing time by 80% and eliminated manual errors. The system integrates perfectly with our existing accounting software."',
    name: 'Emily T.',
    designation: 'Accounts Manager',
    avatar: avatar31,
  },
  {
    title: 'Real-Time Financial Insights',
    description:
      '"Having real-time financial insights at our fingertips has revolutionized our decision-making process. The customizable dashboards show exactly what we need, when we need it. Highly recommend!"',
    name: 'James L.',
    designation: 'VP of Finance',
    avatar: avatar33,
  },
  {
    title: 'Simplified Expense Management',
    description:
      '"Expense management is now effortless. Our team can submit expenses on the go, and approvals are automated. The mobile app makes everything accessible, and we\'ve cut down expense processing time significantly."',
    name: 'Lisa W.',
    designation: 'Operations Manager',
    avatar: avatar34,
  },
  {
    title: 'Comprehensive Financial Analytics',
    description:
      '"The analytics capabilities are outstanding. We can drill down into any metric, compare periods, and identify trends instantly. This platform has given us the financial intelligence we\'ve always needed."',
    name: 'Robert H.',
    designation: 'Chief Financial Officer',
    avatar: avatar35,
  },
  {
    title: 'Seamless Integration & Support',
    description:
      '"Implementation was smooth, and the support team is exceptional. The platform integrates seamlessly with our ERP system, and we\'ve seen immediate ROI. Best financial management solution we\'ve used."',
    name: 'Jennifer A.',
    designation: 'Finance Lead',
    avatar: avatar36,
  },
];

const Testimonial = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) {
      return;
    }

    const updateSlideStyles = () => {
      const slides = swiper.slides;
      const activeIndex = swiper.activeIndex;
      const slidesPerView = typeof swiper.params.slidesPerView === 'number' ? swiper.params.slidesPerView : 4;

      slides.forEach((slide, index) => {
        slide.style.transition = 'opacity 0.6s ease-out, filter 0.6s ease-out';

        let offset = index - activeIndex;
        if (offset < 0) {
          offset += slides.length;
        }

        if (offset >= 0 && offset < slidesPerView) {
          slide.style.opacity = '1';
          slide.style.filter = 'blur(0px)';
        } else {
          slide.style.opacity = '0.3';
          slide.style.filter = 'blur(30px)';
        }
      });
    };

    swiper.on('init', updateSlideStyles);
    swiper.on('slideChangeTransitionStart', updateSlideStyles);

    return () => {
      swiper.off('init', updateSlideStyles);
      swiper.off('slideChangeTransitionStart', updateSlideStyles);
    };
  }, []);

  return (
    <section className="py-12 md:py-14 lg:py-18 xl:py-24">
      <div className="main-container">
        <div className="space-y-9">
          <RevealAnimation delay={0.1}>
            <div className="bg-background-4 rounded-3xl p-1 md:rounded-4xl">
              <Swiper
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                modules={[Autoplay, Pagination]}
                breakpoints={{
                  425: {
                    slidesPerView: 1,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                  1290: {
                    slidesPerView: 4,
                  },
                }}
                spaceBetween={4}
                initialSlide={4}
                loop={true}
                loopAdditionalSlides={2}
                speed={1100}
                allowTouchMove={true}
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                }}
                pagination={{
                  el: '.financial-management-platform-pagination',
                  clickable: true,
                  type: 'bullets',
                  dynamicBullets: false,
                }}
                className="financial-management-platform-swiper">
                {testimonials.map((testimonial) => (
                  <SwiperSlide key={`${testimonial.name}-${testimonial.title}`}>
                    <TestimonialCard {...testimonial} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </RevealAnimation>

          {/* pagination bullets */}
          <RevealAnimation delay={0.2}>
            <div className="financial-management-platform-pagination bg-secondary mx-auto flex !h-6 !w-fit items-center justify-center rounded-[56px] p-2 text-center" />
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

Testimonial.displayName = 'Testimonial';
export default Testimonial;
