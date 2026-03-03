'use client';

import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { useTabV2 } from '../../../context/TabV2Context';

interface TabV2Props {
  tabId: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const TabV2: React.FC<TabV2Props> = ({ tabId, children, className = '', ariaLabel }) => {
  const { activeTab, switchToTab, registerTabButton } = useTabV2();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registerTabButton(tabId, buttonRef.current);

    return () => {
      registerTabButton(tabId, null);
    };
  }, [tabId, registerTabButton]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    switchToTab(tabId);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switchToTab(tabId);
    }
  };

  const isActive = activeTab === tabId;

  return (
    <button
      ref={buttonRef}
      id={`tab-${tabId}`}
      role="tab"
      aria-controls={`tab-panel-${tabId}`}
      aria-selected={isActive}
      aria-label={ariaLabel || `${tabId} service tab`}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'cursor-pointer transition-colors duration-300 ease-in-out',
        isActive ? 'text-white' : 'text-secondary/60',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}>
      {children}
    </button>
  );
};

TabV2.displayName = 'TabV2';
export default TabV2;
