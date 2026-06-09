import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import SecurityHero from "./_components/SecurityHero.tsx";
import SecurityPlans from "./_components/SecurityPlans.tsx";
import SecurityFeatures from "./_components/SecurityFeatures.tsx";
import SecuritySslSection from "./_components/SecuritySslSection.tsx";
import SecurityFAQ from "./_components/SecurityFAQ.tsx";
import SecurityCTA from "./_components/SecurityCTA.tsx";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <SecurityHero />
      <SecurityPlans />
      <SecurityFeatures />
      <SecuritySslSection />
      <SecurityFAQ />
      <SecurityCTA />
      <Footer />
    </div>
  );
}
