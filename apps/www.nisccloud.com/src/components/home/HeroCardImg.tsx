'use client';
import { useGSAP } from '@gsap/react';
import heroImage from '@public/images/ns-img-579.png';
import gsap from 'gsap';
import Image from 'next/image';
import { useRef } from 'react';

const HeroCardImg = () => {
  const figureRef = useRef<HTMLElement>(null);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentTweenRef = useRef<gsap.core.Tween | null>(null);
  const lastDirectionRef = useRef<'up' | 'down'>('down');

  useGSAP(
    () => {
      const item = figureRef.current;
      if (!item) {
        return;
      }

      const startRotation = (direction: 'up' | 'down', duration: number) => {
        currentTweenRef.current?.kill();
        currentTweenRef.current = gsap.to(item, {
          rotate: direction === 'up' ? '-=360' : '+=360',
          duration,
          ease: 'linear',
          transformOrigin: 'center center',
          repeat: -1,
        });
      };

      const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        let direction: 'up' | 'down' | null = null;
        if (scrollTop > lastScrollTopRef.current) {
          direction = 'down';
        } else if (scrollTop < lastScrollTopRef.current) {
          direction = 'up';
        }

        if (direction) {
          lastDirectionRef.current = direction;
          startRotation(direction, 12);
        }

        lastScrollTopRef.current = Math.max(scrollTop, 0);

        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          startRotation(lastDirectionRef.current, 60);
        }, 150);
      };

      window.addEventListener('scroll', handleScroll);
      startRotation('down', 50);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        currentTweenRef.current?.kill();
        clearTimeout(scrollTimeoutRef.current);
      };
    },
    { scope: figureRef },
  );

  return (
    <div className="mt-16 xl:mt-14">
      <figure
        ref={figureRef}
        className="financial-management-platform-hero-spin pointer-events-none absolute left-1/2 w-full max-w-[700px] -translate-x-1/2 lg:max-w-[897px]"
        aria-hidden="true">
        <Image
          src={heroImage}
          alt="Decorative illustration of financial management platform interface with credit cards"
          width={897}
          height={897}
          className="size-full object-cover"
          itemProp="image"
        />
      </figure>
    </div>
  );
};

HeroCardImg.displayName = 'HeroCardImg';
export default HeroCardImg;
