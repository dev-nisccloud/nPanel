import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { usePageMeta } from "@/lib/seo.ts";
import { NOT_FOUND_META } from "@/lib/route-meta.ts";
import Navbar from "./_components/Navbar.tsx";
import Footer from "./_components/Footer.tsx";

const SUGGESTIONS = [
  { label: "Web hosting", href: "/hosting", text: "Domains, hosting, email and servers." },
  { label: "Business solutions", href: "/services", text: "Websites, brand, marketing and software." },
  { label: "Pricing", href: "/pricing", text: "Plans for hosting, email and services." },
  { label: "Careers", href: "/careers", text: "Open roles and how to apply." },
  { label: "Help centre", href: "/help", text: "Answers for accounts and services." },
  { label: "Contact", href: "/contact", text: "Email, phone, or send a brief." },
] as const;

export default function NotFound() {
  const location = useLocation();
  usePageMeta(NOT_FOUND_META);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404: no route for", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-16 pb-28 md:px-8 md:py-24">
        <p className="type-label mb-3 text-[#38b6ff] dark:text-[#38b6ff]">404</p>
        <h1 className="type-h1 max-w-3xl">This page is not on the site</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1 text-sm text-foreground">{location.pathname}</span>{" "}
          does not match a page. The address may be out of date, or the page may have moved.
        </p>
        <div className="mt-8">
          <Button asChild className="min-h-11 rounded-[10px] px-5">
            <Link to="/">Back to the homepage</Link>
          </Button>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUGGESTIONS.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="block h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff] focus-visible:ring-offset-2"
              >
                <span className="block text-lg font-semibold text-foreground">{item.label}</span>
                <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
