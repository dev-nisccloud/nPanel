import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import WorkHero from "./_components/WorkHero.tsx";
import PortfolioGrid from "./_components/PortfolioGrid.tsx";
import WorkCTA from "./_components/WorkCTA.tsx";

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <WorkHero />
      <PortfolioGrid />
      <WorkCTA />
      <Footer />
    </div>
  );
}
