import { faqJsonLd, usePageMeta } from "@/lib/seo.ts";
import { HOME_FAQ_CATEGORIES } from "./_components/home-faqs.ts";
import Navbar from "./_components/Navbar.tsx";
import Hero from "./_components/Hero.tsx";
import NeedSelector from "./_components/NeedSelector.tsx";
import NpanelShowcase from "./_components/NpanelShowcase.tsx";
import BuildRunGrow from "./_components/BuildRunGrow.tsx";
import CloudProducts from "./_components/CloudProducts.tsx";
import DomainSearch from "./_components/DomainSearch.tsx";
import WhyNisc from "./_components/WhyNisc.tsx";
import Faq from "./_components/Faq.tsx";
import HomeClosing from "./_components/HomeClosing.tsx";
import Footer from "./_components/Footer.tsx";

const HOME_TITLE = "Nisc Cloud | Cloud Hosting, Websites & Digital Growth";
const HOME_DESCRIPTION =
  "Build, run and grow with Nisc Cloud: domains, hosting, business email, websites, software, digital marketing and nPanel for businesses, agencies and developers.";

const HOME_FAQ_JSONLD = faqJsonLd(
  HOME_FAQ_CATEGORIES.flatMap((c) => c.items).map((f) => ({ q: f.question, a: f.answer })),
);

export default function Index() {
  usePageMeta({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonicalPath: "/",
    jsonLd: HOME_FAQ_JSONLD,
  });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main id="main-content">
        <Hero />
        <NeedSelector />
        <NpanelShowcase />
        <BuildRunGrow />
        <CloudProducts />
        <DomainSearch compact />
        <WhyNisc />
        <Faq />
        <HomeClosing />
      </main>
      <Footer />
    </div>
  );
}
