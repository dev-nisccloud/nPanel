import RevealAnimation from '@/components/animation/RevealAnimation';
import SearchCta from '@/components/domains/SearchCta';
import CTA from '@/components/shared/cta/CTA';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'Domain search - Find and register your domain | Nisc Cloud',
};

const DomainSearchPage = () => {
  return (
    <main className="bg-background-3 dark:bg-background-7">
      {/* <section
        className="pt-24 pb-2 sm:pt-28 md:pt-8 md:pb-3"
        aria-label="Domain search">
        <div className="main-container">
          <div className="mx-auto max-w-[680px] text-center">
            <RevealAnimation delay={0.2}>
              <h1 className="text-heading-3 md:text-heading-2">
                Find your perfect domain name
              </h1>
            </RevealAnimation>
          </div>
        </div>
      </section> */}
      <SearchCta />
      <CTA
        className="dark:bg-background-6 bg-white"
        badgeText="Get started"
        badgeClass="!badge-cyan"
        ctaHeading="Ready to register or transfer your domain?"
        description="Choose a plan and get your domain live with Nisc Cloud. We'll help you every step of the way."
        ctaBtnText="View domains"
      />
    </main>
  );
};

export default DomainSearchPage;
