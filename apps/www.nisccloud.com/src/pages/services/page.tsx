import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import ServiceHero from "./_components/ServiceHero.tsx";
import ServicesFeatureBlocks from "./_components/ServicesFeatureBlocks.tsx";
import CreateDetail from "./_components/CreateDetail.tsx";
import LaunchDetail from "./_components/LaunchDetail.tsx";
import MarketDetail from "./_components/MarketDetail.tsx";
import AutomateDetail from "./_components/AutomateDetail.tsx";
import ServicesCTA from "./_components/ServicesCTA.tsx";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <ServiceHero />
      <ServicesFeatureBlocks />
      <CreateDetail />
      <LaunchDetail />
      <MarketDetail />
      <AutomateDetail />
      <ServicesCTA />
      <Footer />
    </div>
  );
}
