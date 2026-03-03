import CTA from '@/components/home/CTA';
import Faq from '@/components/home/Faq';
import Hero from '@/components/home/Hero';
import Integration from '../components/home/integration';
import Services from '@/components/home/Services';
import SearchCta from '@/components/home/SearchCta';
import Testimonial from '@/components/home/Testimonial';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Nisc Cloud - Web & Email Hosting | 360° Digital Marketing | Creative Visual Brand Identity.',
};

const page = () => {
  return (
    <main className="bg-white">
      <Hero />
      <SearchCta />
      <Services />
      {/* <AITools /> */}
      <Integration />
      <Testimonial />
      {/* <AutomationPlatform /> */}
      <Faq />
      {/* <Blog /> */}
      <CTA />
    </main>
  );
};

export default page;
