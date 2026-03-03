'use client';

import { cn } from '@/utils/cn';

interface TabV2ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

const TabV2ContentContainer: React.FC<TabV2ContentContainerProps> = ({ children, className = '' }) => {
  return (
    <div role="tabpanel" aria-live="polite" aria-atomic="true" className={cn(className)}>
      {children}
    </div>
  );
};

TabV2ContentContainer.displayName = 'TabV2ContentContainer';
export default TabV2ContentContainer;
