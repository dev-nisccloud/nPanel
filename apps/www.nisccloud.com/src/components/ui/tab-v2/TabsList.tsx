'use client';

import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { useTabV2 } from '../../../context/TabV2Context';

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TabsList: React.FC<TabsListProps> = ({ children, className = '', style }) => {
  const { registerTabContainer, registerActiveIndicator } = useTabV2();
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerTabContainer(tabListRef.current);
    registerActiveIndicator(activeIndicatorRef.current);
  }, [registerTabContainer, registerActiveIndicator]);

  return (
    <div ref={tabListRef} role="tablist" className={cn('relative', className)} style={style}>
      {/* active tab indicator */}
      <div
        ref={activeIndicatorRef}
        className="bg-secondary absolute left-0 z-10 rounded-2xl transition-all duration-500 ease-out md:rounded-[80px]"
      />

      {children}
    </div>
  );
};

TabsList.displayName = 'TabsList';
export default TabsList;

