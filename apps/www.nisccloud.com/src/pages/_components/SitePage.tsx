import type { ReactNode } from "react";
import Navbar from "./Navbar.tsx";
import Footer from "./Footer.tsx";

export default function SitePage({
  eyebrow = "Nisc Cloud",
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="type-label mb-3 text-[#38b6ff] dark:text-[#38b6ff]">{eyebrow}</p>
        <h1 className="type-h1 max-w-3xl text-foreground">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{lede}</p>
        {children ? <div className="mt-10">{children}</div> : null}
      </main>
      <Footer />
    </div>
  );
}
