'use client';

import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { useTabV2 } from '../../../context/TabV2Context';

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  ariaLabel?: string;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = '',
  activeClassName = 'text-white',
  inactiveClassName = 'text-secondary/60',
  ariaLabel,
}) => {
  const { activeTab, switchToTab, registerTabButton } = useTabV2();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registerTabButton(value, buttonRef.current);

    return () => {
      registerTabButton(value, null);
    };
  }, [value, registerTabButton]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    switchToTab(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switchToTab(value);
    }
  };

  const isActive = activeTab === value;

  return (
    <button
      ref={buttonRef}
      id={`tab-${value}`}
      role="tab"
      aria-controls={`tab-panel-${value}`}
      aria-selected={isActive}
      aria-label={ariaLabel || `${value} tab`}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'cursor-pointer transition-colors duration-300 ease-in-out',
        isActive ? activeClassName : inactiveClassName,
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}>
      {children}
    </button>
  );
};

TabsTrigger.displayName = 'TabsTrigger';
export default TabsTrigger;

