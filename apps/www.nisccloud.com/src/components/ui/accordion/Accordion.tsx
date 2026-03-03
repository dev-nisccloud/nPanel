'use client';

import { cn } from '@/utils/cn';
import React, { createContext, useContext, useState } from 'react';

// Accordion Context Types
export interface AccordionContextType {
  activeItem: string | null;
  setActiveItem: (item: string | null) => void;
  allowMultiple: boolean;
  disabled: boolean;
}

export interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
  allowMultiple?: boolean;
  disabled?: boolean;
}

// Create Accordion Context
const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

// Hook to use Accordion Context
export const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (context === undefined) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

const Accordion: React.FC<AccordionProps> = ({
  children,
  className,
  defaultValue,
  allowMultiple = false,
  disabled = false,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(defaultValue || null);

  const handleItemToggle = (itemValue: string | null) => {
    if (disabled) {
      return;
    }

    if (allowMultiple) {
      // For multiple mode, we'd need a different state structure
      // This implementation focuses on single accordion mode
      setActiveItem(activeItem === itemValue ? null : itemValue);
    } else {
      setActiveItem(activeItem === itemValue ? null : itemValue);
    }
  };

  return (
    <AccordionContext.Provider
      value={{
        activeItem,
        setActiveItem: handleItemToggle,
        allowMultiple,
        disabled,
      }}>
      <div className={cn('w-full', className)} role="region" aria-label="Accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

Accordion.displayName = 'Accordion';

export default Accordion;
