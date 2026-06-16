import { useLayoutEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

export const ScrollStackItem = ({ children, itemClassName = '' }: { children: React.ReactNode; itemClassName?: string }) => (
  <div className="scroll-stack-card-wrapper">
    <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
  </div>
);

interface ScrollStackProps {
  children: React.ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}: ScrollStackProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<{ wrapper: HTMLElement; card: HTMLElement }[]>([]);
  const lastTransformsRef = useRef(new Map());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value as string);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement
      };
    } else {
      const scroller = scrollerRef.current!;
      return {
        scrollTop: scroller.scrollTop,
        containerHeight: scroller.clientHeight,
        scrollContainer: scroller
      };
    }
  }, [useWindowScroll]);

  const getElementOffset = useCallback(
    (element: HTMLElement) => {
      if (useWindowScroll) {
        const rect = element.getBoundingClientRect();
        return rect.top + window.scrollY;
      } else {
        return element.offsetTop;
      }
    },
    [useWindowScroll]
  );

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition!, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition!, containerHeight);

    const endElement = useWindowScroll
      ? document.querySelector('.scroll-stack-end') as HTMLElement
      : scrollerRef.current?.querySelector('.scroll-stack-end') as HTMLElement;

    const endElementTop = endElement ? getElementOffset(endElement) : 0;

    cardsRef.current.forEach(({ wrapper, card }, i) => {
      if (!card || !wrapper) return;

      // Measure wrapper position, not the card! This stops the infinite transform flickering loop.
      const cardTop = getElementOffset(wrapper);
      const triggerStart = cardTop - stackPositionPx - itemStackDistance! * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - itemStackDistance! * i;
      const pinEnd = endElementTop - containerHeight / 2;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale! + i * itemScale!;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount! * scaleProgress : 0;

      let blur = 0;
      let opacity = 0;
      
      // Determine the currently active top card
      let topCardIndex = 0;
      for (let j = 0; j < cardsRef.current.length; j++) {
        const jCardTop = getElementOffset(cardsRef.current[j].wrapper);
        const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance! * j;
        if (scrollTop >= jTriggerStart - 10) {
          topCardIndex = j;
        }
      }

      // Calculate the trigger start of the next card
      let nextTriggerStart = pinEnd;
      if (i < cardsRef.current.length - 1) {
        const nextWrapper = cardsRef.current[i + 1].wrapper;
        const nextCardTop = getElementOffset(nextWrapper);
        nextTriggerStart = nextCardTop - stackPositionPx - itemStackDistance! * (i + 1);
      }

      if (i === topCardIndex) {
        // Active card: fade out as we approach the next card's trigger
        if (i < cardsRef.current.length - 1) {
          const distanceToNext = nextTriggerStart - scrollTop;
          opacity = Math.max(0, Math.min(1, distanceToNext / itemDistance!));
        } else {
          opacity = 1;
        }
      } else if (i === topCardIndex + 1) {
        // Immediate next card: fade in as we approach its trigger
        const distanceToPin = triggerStart - scrollTop;
        opacity = Math.max(0, Math.min(1, 1 - (distanceToPin / itemDistance!)));
      } else {
        // All other cards are completely hidden
        opacity = 0;
      }

      if (blurAmount && i < topCardIndex) {
        const depthInStack = topCardIndex - i;
        blur = Math.max(0, depthInStack * blurAmount);
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance! * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance! * i;
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
        opacity: Math.round(opacity * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1 ||
        Math.abs(lastTransform.opacity - newTransform.opacity) > 0.01;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        card.style.filter = filter;
        card.style.opacity = newTransform.opacity.toString();

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData,
    getElementOffset
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    // IMPORTANT: If we use window scroll, we MUST hook into the root lenis instance or let it naturally use window scroll
    // Creating a new Lenis instance on the window can conflict with existing smooth scrolling.
    if (useWindowScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return null;
    } else {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        normalizeWheel: true,
        wheelMultiplier: 1,
        touchInertiaMultiplier: 35,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075,
        touchInertia: 0.6
      } as any);

      lenis.on('scroll', handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    }
  }, [handleScroll, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const wrappers = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card-wrapper')
        : scroller.querySelectorAll('.scroll-stack-card-wrapper')
    ) as HTMLElement[];

    cardsRef.current = wrappers.map(wrapper => ({
      wrapper,
      card: wrapper.querySelector('.scroll-stack-card') as HTMLElement
    }));

    const transformsCache = lastTransformsRef.current;

    cardsRef.current.forEach(({ wrapper, card }, i) => {
      if (i < cardsRef.current.length - 1) {
        wrapper.style.marginBottom = `${itemDistance}px`;
      }
      card.style.willChange = 'transform, filter';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translateZ(0)';
      (card.style as any).webkitTransform = 'translateZ(0)';
      card.style.perspective = '1000px';
      (card.style as any).webkitPerspective = '1000px';
    });

    setupLenis();

    updateCardTransforms();

    return () => {
      if (useWindowScroll) {
        window.removeEventListener('scroll', handleScroll);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
    handleScroll
  ]);

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end" />
      </div>
    </div>
  );
};

export default ScrollStack;
