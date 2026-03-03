'use client';

import { TabV2Provider } from '../../../context/TabV2Context';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ children, defaultValue, value, onValueChange }) => {
  // If controlled (value prop provided), we need to handle it differently
  // For now, we'll use defaultValue for uncontrolled mode
  return <TabV2Provider defaultValue={value || defaultValue}>{children}</TabV2Provider>;
};

Tabs.displayName = 'Tabs';
export default Tabs;

