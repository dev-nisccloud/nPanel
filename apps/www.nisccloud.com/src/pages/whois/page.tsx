import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import WhoisChecker from "./_components/WhoisChecker.tsx";

export default function WhoisPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        <WhoisChecker />
      </main>
      <Footer />
    </div>
  );
}
