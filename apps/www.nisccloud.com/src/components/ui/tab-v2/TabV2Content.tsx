'use client';

import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { useTabV2 } from '../../../context/TabV2Context';

interface TabV2ContentProps {
  tabId: string;
  children: React.ReactNode;
  className?: string;
  display?: 'flex' | 'block' | 'grid' | 'inline-block';
}

const TabV2Content: React.FC<TabV2ContentProps> = ({ tabId, children, className = '', display = 'flex' }) => {
  const { activeTab, registerTabContent } = useTabV2();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerTabContent(tabId, contentRef.current);

    return () => {
      registerTabContent(tabId, null);
    };
  }, [tabId, registerTabContent]);

  const isActive = activeTab === tabId;

  // Animation is handled by the context's showContent function
  // which calls triggerRevealAnimation when content becomes active

  return (
    <div
      ref={contentRef}
      id={`tab-panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      aria-hidden={!isActive}
      className={cn('pointer-events-none', isActive ? display : 'hidden', className)}
      style={{ display: isActive ? display : 'none' }}>
      {children}
    </div>
  );
};

TabV2Content.displayName = 'TabV2Content';
export default TabV2Content;
