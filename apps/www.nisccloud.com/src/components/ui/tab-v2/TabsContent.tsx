'use client';

import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { useTabV2 } from '../../../context/TabV2Context';

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  display?: 'flex' | 'block' | 'grid' | 'inline-block';
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '', display = 'flex' }) => {
  const { activeTab, registerTabContent } = useTabV2();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerTabContent(value, contentRef.current);

    return () => {
      registerTabContent(value, null);
    };
  }, [value, registerTabContent]);

  const isActive = activeTab === value;

  // Animation is handled by the context's showContent function
  // which calls triggerRevealAnimation when content becomes active

  return (
    <div
      ref={contentRef}
      id={`tab-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      aria-hidden={!isActive}
      className={cn('pointer-events-none', isActive ? display : 'hidden', className)}
      style={{ display: isActive ? display : 'none' }}>
      {children}
    </div>
  );
};

TabsContent.displayName = 'TabsContent';
export default TabsContent;

