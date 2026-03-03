import Hero from '@/components/email-marketing/Hero';
import CustomerFeedback from '@/components/email-marketing/CustomerFeedback';
import FeaturesHighlight from '@/components/email-marketing/FeaturesHighlight';
import Features from '@/components/email-marketing/Features';
import Process from '@/components/email-marketing/Process';
import OurAchievements from '@/components/shared/OurAchievements';
import Contact from '@/components/faq/Contact';
import FaqTab from '@/components/faq/FaqTab';
import CTA from '@/components/shared/cta/CTA';
import { defaultMetadata } from '@/utils/generateMetaData';
import { Metadata } from 'next';
import { projectAchievements } from '@/data/achievements';

export const metadata: Metadata = {
    ...defaultMetadata,
    title: 'Email Marketing - Nisc Cloud',
    description: 'Send beautiful, targeted email campaigns with an easy drag-and-drop builder that anyone on your team can use.',
    keywords: ['email marketing', 'email campaigns', 'email builder', 'email templates', 'email automation', 'email marketing platform', 'email marketing software', 'email marketing service', 'email marketing tool', 'email marketing solution'],
};

const EmailMarketing = () => {
    return (
        <main className="bg-background-3 dark:bg-background-7">
            <Hero />
            <CustomerFeedback />
            <FeaturesHighlight />
            <Features />
            <Process />
            <section className="py-10 max-xl:px-5 md:py-16">
                <div className="main-container">
                    <OurAchievements achievements={projectAchievements} instant={false} />
                </div>
            </section>
            <FaqTab />
            <Contact />
            <CTA
                className="dark:bg-background-6 bg-white"
                badgeClass="!badge-cyan"
                badgeText="Get Started"
                ctaHeading="Ready to start earning with NextSaaS?"
                description="If you have any questions, feel free to reach out to our team."
                ctaBtnText="Get started"
            />
        </main>
    );
};

export default EmailMarketing;
