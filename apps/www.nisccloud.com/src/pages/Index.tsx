import Navbar from "./_components/Navbar.tsx";
import Hero from "./_components/Hero.tsx";
import PainAgitation from "./_components/PainAgitation.tsx";
import NeedSelector from "./_components/NeedSelector.tsx";
import Stats from "./_components/Stats.tsx";
import AtomApproach from "./_components/AtomApproach.tsx";
import DashboardPreview from "./_components/DashboardPreview.tsx";
import Features from "./_components/Features.tsx";
import DomainSearch from "./_components/DomainSearch.tsx";
import Testimonials from "./_components/Testimonials.tsx";
import Faq from "./_components/Faq.tsx";
import ClosingCTA from "./_components/ClosingCTA.tsx";
import GrowthAuditCTA from "./_components/GrowthAuditCTA.tsx";
import Footer from "./_components/Footer.tsx";
import { MessageCircle } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <NeedSelector />
      <Stats />
      <PainAgitation />
      <AtomApproach />
      <DomainSearch />
      {/* <DashboardPreview /> */}
      <Features />
      <Testimonials />
      <Faq />
      <Footer />

      {/* WhatsApp floating CTA */}
      <a
        href="https://wa.me/254700000000?text=Hi%20Nisc%20Cloud%2C%20I%20want%20to%20grow%20my%20business%20online"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] text-white font-semibold text-sm px-4 py-3 rounded-full shadow-lg hover:bg-[#1ebe5d] transition-all hover:scale-105 cursor-pointer"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={18} className="fill-white" />
        <span className="hidden sm:inline">Chat with us</span>
      </a>
    </div>
  );
}
