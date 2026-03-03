'use client';

import { cn } from '@/utils/cn';
import { FC, ReactNode } from 'react';
import { useAccordion } from './Accordion';

export interface AccordionContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

const AccordionContent: FC<AccordionContentProps> = ({ children, value, className }) => {
  const { activeItem } = useAccordion();
  const isActive = activeItem === value;

  return (
    <div
      id={`accordion-content-${value}`}
      className={cn(
        'grid transition-all duration-300 ease-out',
        isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        className,
      )}
      aria-labelledby={`accordion-trigger-${value}`}
      data-state={isActive ? 'open' : 'closed'}
      aria-hidden={!isActive}>
      <div className={cn('overflow-hidden', !isActive && 'pointer-events-none')}>{children}</div>
    </div>
  );
};

AccordionContent.displayName = 'AccordionContent';
export default AccordionContent;
