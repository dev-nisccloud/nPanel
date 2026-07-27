import Navbar from "./_components/Navbar.tsx";
import Hero from "./_components/Hero.tsx";
import PainAgitation from "./_components/PainAgitation.tsx";
import NeedSelector from "./_components/NeedSelector.tsx";
// import Stats from "./_components/Stats.tsx";
import AtomApproach from "./_components/AtomApproach.tsx";
import BentoFeatures from "./_components/BentoFeatures.tsx";
import DomainSearch from "./_components/DomainSearch.tsx";
import Testimonials from "./_components/Testimonials.tsx";
import Faq from "./_components/Faq.tsx";
import Footer from "./_components/Footer.tsx";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <NeedSelector />
      {/* <Stats /> */}
      <DomainSearch compact />
      <PainAgitation />
      <AtomApproach />
      <BentoFeatures />
      <Testimonials />
      <Faq />
      <Footer />
    </div>
  );
}
