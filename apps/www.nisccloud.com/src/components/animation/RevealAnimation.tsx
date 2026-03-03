'use client';
import { cn } from '@/utils/cn';
import Springer from '@/utils/springer';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { ReactElement, Ref, cloneElement, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

interface RevealAnimationProps {
  children: ReactElement<{
    className?: string;
    ref?: Ref<HTMLElement>;
    'data-ns-animate'?: boolean;
    style?: React.CSSProperties;
  }>;
  duration?: number;
  delay?: number;
  offset?: number;
  instant?: boolean;
  start?: string;
  end?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  useSpring?: boolean;
  rotation?: number;
  animationType?: 'from' | 'to';
  className?: string;
}

const RevealAnimation = ({
  children,
  duration = 0.6,
  delay = 0,
  offset = 60,
  instant = false,
  start = 'top 90%',
  end = 'top 50%',
  direction = 'down',
  useSpring = false,
  rotation = 0,
  animationType = 'from',
  className = '',
}: RevealAnimationProps) => {
  const elementRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // Helper function to get spring easing
    const getSpringEasing = (): gsap.EaseFunction | string => {
      if (useSpring) {
        return Springer.default(0.2, 0.8);
      }
      return 'power2.out';
    };

    // Helper function to get base animation properties
    const getBaseAnimationProps = (): gsap.TweenVars => {
      const baseProps: gsap.TweenVars = {
        duration,
        delay,
        ease: getSpringEasing(),
      };

      if (rotation !== 0) {
        baseProps.rotation = rotation;
      }

      return baseProps;
    };

    // Helper function to set direction properties
    const setDirectionProperties = (
      props: gsap.TweenVars,
      dir: 'up' | 'down' | 'left' | 'right',
      animType: 'from' | 'to',
      off: number,
    ): void => {
      const directionMap = {
        left: { prop: 'x', value: -off },
        right: { prop: 'x', value: off },
        down: { prop: 'y', value: off },
        up: { prop: 'y', value: -off },
      };

      const { prop, value } = directionMap[dir];
      props[prop as keyof gsap.TweenVars] = animType === 'from' ? value : 0;

      if (animType === 'to') {
        gsap.set(element, { [prop]: value });
      }
    };

    // Helper function to create animation properties
    const createAnimationProps = (): gsap.TweenVars => {
      const props = getBaseAnimationProps();

      if (animationType === 'to') {
        props.opacity = 1;
        props.filter = 'blur(0)';
      } else {
        props.opacity = 0;
        props.filter = 'blur(16px)';
      }

      if (!instant) {
        props.scrollTrigger = {
          trigger: element,
          start,
          end,
          scrub: false,
        };
      }

      setDirectionProperties(props, direction, animationType, offset);
      return props;
    };

    // For instant mode, skip setting initial styles (already set via props to prevent hydration mismatch)
    // For non-instant mode, set initial styles only if needed
    if (!instant) {
      element.style.opacity = '1';
      element.style.filter = 'blur(0)';
    }

    const animationProps = createAnimationProps();

    // Use appropriate GSAP method based on animation type
    if (animationType === 'to') {
      gsap.to(element, animationProps);
    } else {
      gsap.from(element, animationProps);
    }
  }, [duration, delay, offset, instant, start, end, direction, useSpring, rotation, animationType]);

  // Early return if children is not valid (after all hooks)
  if (!children || !React.isValidElement(children)) {
    return null;
  }

  // For instant mode, set initial styles to prevent hydration mismatch
  const initialStyle = instant
    ? {
        opacity: 1,
        filter: 'blur(0)',
        ...children?.props?.style,
      }
    : children?.props?.style;

  // Clone the child element and add the ref, className, data-ns-animate attribute, and initial style
  return cloneElement(children, {
    ref: elementRef,
    className: cn(children?.props?.className, className),
    'data-ns-animate': true,
    style: initialStyle,
  });
};

export default RevealAnimation;
