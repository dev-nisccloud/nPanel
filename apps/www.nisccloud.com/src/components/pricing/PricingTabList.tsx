'use client';

import { pricingCategories } from '@/data/pricing';
import { Fragment } from 'react';
import Tab from '../ui/tab/Tab';
import TabList from '../ui/tab/TabList';

const PricingTabList = () => {
  return (
    <Fragment>
      <TabList variant="desktop">
        {pricingCategories.map((category, index) => (
          <Tab key={category.id} index={index} variant="desktop">
            {category.label}
          </Tab>
        ))}
      </TabList>
      <TabList variant="mobile">
        {pricingCategories.map((category, index) => (
          <Tab
            key={category.id}
            index={index}
            variant="mobile"
            className={category.label.length > 18 ? 'text-nowrap' : undefined}>
            {category.label}
          </Tab>
        ))}
      </TabList>
    </Fragment>
  );
};

export default PricingTabList;
