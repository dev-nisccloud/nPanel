'use client';

import { cn } from '@/utils/cn';
import { useCallback, useRef } from 'react';

interface SubmitButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

const SubmitButton = ({ className, children, ariaLabel, ...buttonProps }: SubmitButtonProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const calculateDistance = useCallback(() => {
    if (!wrapperRef.current || !iconRef.current) {
      return { iconTranslateXDistance: 0, textTranslateXDistance: 0 };
    }

    const wrapperWidth = Math.ceil(wrapperRef.current.clientWidth);
    const iconWidth = iconRef.current.clientWidth;
    const iconTranslateXDistance = wrapperWidth - (iconWidth + 9);
    const textTranslateXDistance = iconWidth;

    return { iconTranslateXDistance, textTranslateXDistance };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!iconRef.current || !textRef.current) {
      return;
    }

    const { iconTranslateXDistance, textTranslateXDistance } = calculateDistance();
    iconRef.current.style.transform = `translateX(${iconTranslateXDistance}px)`;
    textRef.current.style.transform = `translateX(-${textTranslateXDistance}px)`;
  }, [calculateDistance]);

  const handleMouseLeave = useCallback(() => {
    if (!iconRef.current || !textRef.current) {
      return;
    }

    iconRef.current.style.transform = 'translateX(0)';
    textRef.current.style.transform = 'translateX(0)';
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={cn('w-fit cursor-pointer rounded-2xl px-1 py-1', className)}
      aria-label={ariaLabel}
      data-button-v3
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <button className="block" {...buttonProps}>
        <div className="flex items-center gap-x-4">
          {/* icon */}
          <span
            ref={iconRef}
            className="relative z-20 flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] p-2.5 transition-all duration-700 ease-in-out"
            data-button-v3-icon
            aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6">
              <path d="M11 5H13V7H11V5Z" />
              <path d="M5 5H7V7H5V5Z" />
              <path d="M14 8H16V10H14V8Z" />
              <path d="M8 8H10V10H8V8Z" />
              <path d="M17 11H19V13H17V11Z" />
              <path d="M11 11H13V13H11V11Z" />
              <path d="M14 14H16V16H14V14Z" />
              <path d="M8 14H10V16H8V14Z" />
              <path d="M11 17H13V19H11V17Z" />
              <path d="M5 17H7V19H5V17Z" />
            </svg>
          </span>
          {/* content */}
          <span
            ref={textRef}
            className="shrink-0 pr-4 transition-all duration-700 ease-in-out first-letter:uppercase"
            data-button-v3-text=""
            aria-hidden="true">
            {children}
          </span>
        </div>
      </button>
    </div>
  );
};

SubmitButton.displayName = 'SubmitButton';
export default SubmitButton;
