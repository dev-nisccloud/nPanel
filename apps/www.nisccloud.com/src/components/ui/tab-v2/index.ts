// New declarative API
export { default as Tabs } from './Tabs';
export { default as TabsContent } from './TabsContent';
export { default as TabsList } from './TabsList';
export { default as TabsTrigger } from './TabsTrigger';

// Legacy API (for backward compatibility)
export { TabV2Provider, useTabV2 } from '../../../context/TabV2Context';
export { default as TabV2 } from './TabV2';
export { default as TabV2Content } from './TabV2Content';
export { default as TabV2ContentContainer } from './TabV2ContentContainer';
export { default as TabV2List } from './TabV2List';
