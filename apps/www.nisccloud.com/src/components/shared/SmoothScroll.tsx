'use client';
import { ReactLenis, useLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

interface SmoothScrollingProps {
  children: ReactNode;
}

const SmoothScrollProvider = ({ children }: Readonly<SmoothScrollingProps>) => {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string>(pathname);
  const isInitialRender = useRef(true);

  const lenis = useLenis();

  // Memoize Lenis options to prevent unnecessary re-renders
  const lenisOptions = useMemo(
    () => ({
      duration: 1.1,
    }),
    [],
  );

  // Handle route changes and scroll to top
  useEffect(() => {
    // Only scroll to top if pathname actually changed (navigation), not on initial render or reload
    if (!isInitialRender.current && previousPathnameRef.current !== pathname && lenis) {
      lenis.scrollTo(0, { immediate: true });
    }

    // Update refs
    previousPathnameRef.current = pathname;
    isInitialRender.current = false;
  }, [pathname, lenis]);

  // Handle smooth scroll for elements with .lenis-scroll-to class using event delegation
  const handleClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const scrollToElement = target.closest('.lenis-scroll-to');

      if (!scrollToElement || !lenis) {
        return;
      }

      const href = scrollToElement.getAttribute('href');
      if (href) {
        event.preventDefault();
        lenis.scrollTo(href, {
          offset: -100,
        });
      }
    },
    [lenis],
  );

  useEffect(() => {
    if (!lenis) {
      return;
    }

    // Attach to body instead of document for better performance and specificity
    // Using capture phase (true) ensures we catch events before they bubble
    const body = globalThis.document?.body;
    if (!body) {
      return;
    }

    body.addEventListener('click', handleClick, true);

    return () => {
      body.removeEventListener('click', handleClick, true);
    };
  }, [lenis, handleClick]);

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
};

export default SmoothScrollProvider;
