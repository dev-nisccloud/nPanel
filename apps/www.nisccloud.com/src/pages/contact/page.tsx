import Navbar from "../_components/Navbar.tsx";
import Footer from "../_components/Footer.tsx";
import ContactHero from "./_components/ContactHero.tsx";
import ContactForm from "./_components/ContactForm.tsx";
import ContactInfo from "./_components/ContactInfo.tsx";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <ContactHero />
      <section className="py-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
          <div className="lg:col-span-2">
            <ContactInfo />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
