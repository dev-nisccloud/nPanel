import Content from '@/components/change-log/Content';
import Hero from '@/components/change-log/Hero';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Changelog - Financial Management Platform || NextSaaS',
};

const Changelog = () => {
  return (
    <main className="bg-background-3 dark:bg-background-7">
      <Hero />
      <Content />
    </main>
  );
};

export default Changelog;
