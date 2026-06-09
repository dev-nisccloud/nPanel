import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import AboutHero from "./_components/AboutHero.tsx";
import OurStory from "./_components/OurStory.tsx";
import CoreValues from "./_components/CoreValues.tsx";
import TeamSection from "./_components/TeamSection.tsx";
import AboutCTA from "./_components/AboutCTA.tsx";
import AboutFeatureBlocks from "./_components/AboutFeatureBlocks.tsx";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <AboutHero />
      <OurStory />
      <AboutFeatureBlocks />
      <CoreValues />
      <TeamSection />
      <AboutCTA />
      <Footer />
    </div>
  );
}
