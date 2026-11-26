import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import PricingHero from "./_components/PricingHero.tsx";
import PricingPlans from "./_components/PricingPlans.tsx";
import PricingFAQ from "./_components/PricingFAQ.tsx";
import PricingCTA from "./_components/PricingCTA.tsx";

export default function PricingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main id="main-content">
      <PricingHero />
      <PricingPlans />
      <PricingFAQ />
      <PricingCTA />
      </main>
      <Footer />
    </div>
  );
}
