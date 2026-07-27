import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import ComparisonBlock from "@/components/ui/comparison-2.tsx";
import ContactHero from "./_components/ContactHero.tsx";
import ContactForm from "./_components/ContactForm.tsx";
import ContactInfo from "./_components/ContactInfo.tsx";

export default function ContactPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <ContactHero />
      <section id="contact-form" className="scroll-mt-24 pb-10 pt-2 md:pb-12">
        <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 md:px-8 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <ContactInfo />
          </div>
        </div>
      </section>
      <ComparisonBlock onContactPage />
      <Footer />
    </div>
  );
}
