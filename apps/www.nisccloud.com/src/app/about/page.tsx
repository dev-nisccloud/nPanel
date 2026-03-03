import AboutMap from '@/components/about/AboutMap';
import CTA from '@/components/about/CTA';
import Feature from '@/components/about/Feature';
import Innovation from '@/components/about/Innovation';
import OurMission from '@/components/about/OurMission';
import OurVision from '@/components/about/OurVision';
import Teams from '@/components/about/Teams';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'About Us - Financial Management Platform || NextSaaS',
};

const page = () => {
  return (
    <main className="bg-background-3 dark:bg-background-5">
      <Feature />
      <OurMission />
      <OurVision />
      <Innovation />
      <Teams />
      <AboutMap />
      <CTA />
    </main>
  );
};

export default page;
