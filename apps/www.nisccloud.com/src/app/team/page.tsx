import CTA from '@/components/team/CTA';
import Experience from '@/components/team/Experience';
import FAQ from '@/components/team/FAQ';
import Teams from '@/components/team/Teams';
import Testimonial from '@/components/team/Testimonial';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Team - Financial Management Platform || NextSaaS',
};

const page = () => {
  return (
    <main className="bg-background-3 dark:bg-background-7">
      <Teams />
      <Experience />
      <Testimonial />
      <FAQ className="dark:bg-background-5 bg-white py-[50px] md:py-[70px] lg:py-[85px] xl:py-[100px]" />
      <CTA />
    </main>
  );
};

export default page;
