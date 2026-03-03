import Clients from '@/components/success-stories/Clients';
import GlobalStoriesPerformance from '@/components/success-stories/GlobalStoriesPerformance';
import Hero from '@/components/success-stories/hero';
import SpotlightStories from '@/components/success-stories/SpotlightStories';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Success Stories - Financial Management Platform || NextSaaS',
};

const page = () => {
  return (
    <main className="dark:bg-secondary bg-white">
      <Hero />
      <Clients />
      <SpotlightStories />
      <GlobalStoriesPerformance />
    </main>
  );
};

export default page;
