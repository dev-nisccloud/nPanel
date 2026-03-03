import FeatureList from '@/components/features/FeatureList';
import FeatureCard from '@/components/features/Features';
import FeaturesV2 from '@/components/features/FeaturesV2';
import Team from '@/components/features/Team';
import CTA from '@/components/shared/cta/CTA';
import Reviews from '@/components/shared/reviews/Reviews';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Features - Financial Management Platform || NextSaaS',
};

const Features = () => {
  return (
    <main className="bg-background-1 dark:bg-background-6">
      <FeatureCard />
      <Team />
      <FeatureList />
      <FeaturesV2 />
      <Reviews />
      <CTA
        className="dark:bg-background-6 bg-white"
        badgeClass="hidden"
        ctaHeading="Build a complete website using the"
        spanText="assistance"
        description="Start your free trial today and see your ideas come to life easily and creatively."
        ctaBtnText="Get started"
      />
    </main>
  );
};

export default Features;
