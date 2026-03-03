'use client';

import socialIcon from '@public/nisciconwhite.png';
import RevealAnimation from '@/components/animation/RevealAnimation';
import { cn } from '@/utils/cn';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { useRef, type FC } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP, MotionPathPlugin);

const leftNodes = [
  { src: '/images/icons/facebook-1.svg', alt: 'facebook' },
  { src: '/images/icons/instagram-1.svg', alt: 'instagram' },
  { src: '/images/icons/whatsapp.svg', alt: 'whatsapp' },
];

const rightNodes = [
  { src: '/images/icons/linkedin-1.svg', alt: 'linkedin' },
  { src: '/images/icons/tiktok.svg', alt: 'tiktok' },
  { src: '/images/icons/youtube.svg', alt: 'youtube' },
];

const pathData = [
  {
    transform: 'translate(449,240) scale(1.5) translate(-227,-147.703)',
    d: 'M227 147.703H192.062C172.52 147.703 154.769 136.319 146.619 118.558L105.908 29.8482C97.7568 12.0876 80.006 0.703125 60.4644 0.703125H0',
  },
  {
    transform: 'translate(500,250) scale(1.7) translate(-227,0)',
    d: 'M227 0.703125H0',
  },
  {
    transform: 'translate(450,262) scale(1.5) translate(-227,0)',
    d: 'M227 0.703132H192.062C172.52 0.703132 154.769 12.0876 146.619 29.8482L105.908 118.558C97.7568 136.319 80.006 147.703 60.4644 147.703H0',
  },
  {
    transform: 'translate(555,238) scale(1.5) translate(0,-147.703)',
    d: 'M0 147.703H34.9383C54.4799 147.703 72.2306 136.319 80.3814 118.558L121.092 29.8482C129.243 12.0876 146.994 0.703125 166.536 0.703125H227',
  },
  {
    transform: 'translate(500,250) scale(1.7) translate(0,0)',
    d: 'M0 0.703125H227',
  },
  {
    transform: 'translate(566,263) scale(1.5) translate(0,0)',
    d: 'M0 0.703132H34.9383C54.4799 0.703132 72.2306 12.0876 80.3814 29.8482L121.092 118.558C129.243 136.319 146.994 147.703 166.536 147.703H227',
  },
] as const;

const Integration: FC = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const centerLogoRef = useRef<HTMLElement>(null);
  const outerRingRef = useRef<HTMLDivElement>(null);
  const innerRingRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>(pathData.map(() => null));
  const dotRefs = useRef<(SVGCircleElement | null)[]>(pathData.map(() => null));
  const nodeRefs = useRef<(HTMLDivElement | null)[]>(
    Array.from({ length: leftNodes.length + rightNodes.length }, () => null)
  );
  const dotTweensRef = useRef<gsap.core.Tween[]>([]);

  useGSAP(
    () => {
      const container = diagramRef.current;
      const centerLogo = centerLogoRef.current;
      const outerRing = outerRingRef.current;
      const innerRing = innerRingRef.current;
      const paths = pathRefs.current.filter((p): p is SVGPathElement => p != null);
      const nodes = nodeRefs.current.filter((n): n is HTMLDivElement => n != null);

      if (
        !container ||
        !centerLogo ||
        !outerRing ||
        !innerRing ||
        paths.length < 6 ||
        nodes.length < 6
      )
        return;

      gsap.set(centerLogo, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set([outerRing, innerRing], { scale: 0, transformOrigin: '50% 50%' });
      paths.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      });
      const dots = dotRefs.current.filter((d): d is SVGCircleElement => d != null);
      gsap.set(dots, { opacity: 0 });
      gsap.set(nodes, { scale: 0, transformOrigin: '50% 50%' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      });

      tl.to(centerLogo, {
        scale: 1,
        duration: 0.55,
        ease: 'back.out(1.15)',
      });

      tl.to([outerRing, innerRing], { scale: 1, duration: 0.5, ease: 'power2.out' }, '-=0.25');

      tl.to(
        paths,
        {
          strokeDashoffset: 0,
          duration: 0.85,
          stagger: 0.06,
          ease: 'power2.inOut',
        },
        '-=0.1'
      );

      tl.to(
        nodes,
        {
          scale: 1,
          duration: 0.4,
          stagger: 0.07,
          ease: 'back.out(1.2)',
        },
        '-=0.05'
      );

      // Start traveling dots along paths after draw (React-safe: use refs, no querySelector)
      tl.add(() => {
        dotTweensRef.current = [];
        paths.forEach((path, i) => {
          const dot = dotRefs.current[i];
          if (!dot || !path) return;
          gsap.set(dot, { opacity: 0.8 });
          const tween = gsap.to(dot, {
            duration: 4,
            repeat: -1,
            ease: 'none',
            scale: 2.5,
            filter: 'blur(1px)',
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: false,
              start: 0,
              end: 1,
            },
          });
          dotTweensRef.current.push(tween);
        });
      });

      return () => {
        dotTweensRef.current.forEach((t) => t.kill());
        dotTweensRef.current = [];
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: diagramRef }
  );

  return (
    <section className="py-12 md:py-16 lg:py-20 xl:py-24">
      <div className="main-container">
        <div className="mx-auto max-w-[804px] space-y-24">
          <div className="space-y-4 text-center">
            <RevealAnimation delay={0.2}>
              <h2 className="font-manrope text-manrope-heading-4 md:text-manrope-heading-3 lg:text-manrope-heading-2 text-secondary/90 font-medium max-md:leading-[1.2]">
                Manage all your social pages <br className="hidden md:block" />
                <span className="font-instrument-serif text-secondary/70 italic">
                  directly from Nisc Cloud
                </span>
              </h2>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <p className="text-tagline-2 font-inter-tight text-secondary/60 mx-auto max-w-[400px] font-normal">
                Connect your social accounts, plan posts, and keep every page active from one simple
                place, without jumping between different apps.
              </p>
            </RevealAnimation>
          </div>

          {/* SVG Integration Part */}
          <div
            ref={diagramRef}
            className="relative mx-auto h-[320px] max-w-full pb-12 sm:h-[380px] md:h-[424px] md:max-w-[804px]"
          >
            {/* SVG lines */}
            <svg
              className="integration-v7-svg absolute inset-0 h-full w-full"
              viewBox="0 0 1000 500"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              {pathData.map((path, i) => (
                <g key={path.transform} transform={path.transform}>
                  <path
                    ref={(el) => {
                      pathRefs.current[i] = el;
                    }}
                    className="fill-none stroke-1 stroke-[#38b6ff33]"
                    d={path.d}
                  />
                  <circle
                    ref={(el) => {
                      dotRefs.current[i] = el;
                    }}
                    r={2}
                    fill="#38b6ff"
                    opacity={0}
                    aria-hidden
                  />
                </g>
              ))}
            </svg>

            {/* Center logo */}
            <div
              ref={outerRingRef}
              className="border-stroke-3/10 absolute top-1/2 left-1/2 size-[80px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-white backdrop-blur-[20px] md:size-[160px] lg:size-[176px]"
            >
              <div
                ref={innerRingRef}
                className="border-stroke-3/10 absolute top-1/2 left-1/2 size-[90px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border md:size-[120px] lg:size-[136px]"
              >
                <figure
                  ref={centerLogoRef}
                  className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[linear-gradient(135deg,#38b6ff_0%,#00a1ff_50%,#66c7ff_100%)] backdrop-blur-[20px] lg:size-24"
                >
                  <Image
                    src={socialIcon}
                    alt="Nisc Cloud social hub"
                    width={120}
                    height={75}
                    className="w-16 h-auto lg:w-20"
                  />
                </figure>
              </div>
            </div>

            {/* Left nodes */}
            {leftNodes.map((node, index) => (
              <div
                key={node.alt}
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className={cn(
                  'border-stroke-3/10 absolute z-10 grid size-16 place-items-center rounded-4xl border bg-white dark:bg-background-7 sm:size-24 md:size-28',
                  'left-0',
                  index === 0 && 'top-[8%] md:-top-[7%]',
                  index === 1 && 'top-1/2 -translate-y-1/2',
                  index === 2 && 'bottom-[8%] md:-bottom-[7%]'
                )}
              >
                <div className="border-stroke-3/10 absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl border sm:size-20 md:size-23" />
                <figure className="bg-background-2 dark:bg-background-9 size-11 rounded-2xl sm:size-16 md:size-18">
                  <Image
                    src={node.src}
                    alt={node.alt}
                    width={72}
                    height={72}
                    className="size-full object-cover p-3.5"
                  />
                </figure>
              </div>
            ))}

            {/* Right nodes */}
            {rightNodes.map((node, index) => (
              <div
                key={node.alt}
                ref={(el) => {
                  nodeRefs.current[leftNodes.length + index] = el;
                }}
                className={cn(
                  'border-stroke-3/10 absolute z-10 grid size-16 place-items-center rounded-4xl border bg-white dark:bg-background-7 sm:size-24 md:size-28',
                  'right-0',
                  index === 0 && 'top-[8%] md:-top-[7%]',
                  index === 1 && 'top-1/2 -translate-y-1/2',
                  index === 2 && 'bottom-[8%] md:-bottom-[7%]'
                )}
              >
                <div className="border-stroke-3/10 absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl border sm:size-20 md:size-23" />
                <figure className="bg-background-2 dark:bg-background-9 size-11 rounded-2xl sm:size-16 md:size-18">
                  <Image
                    src={node.src}
                    alt={node.alt}
                    width={72}
                    height={72}
                    className={cn(
                      'size-full object-cover',
                      index === 2 ? 'p-2.5 md:p-3.5' : 'p-3.5'
                    )}
                  />
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integration;
