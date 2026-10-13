import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import Index from "./pages/Index.tsx";
import ServicesPage from "./pages/services/page.tsx";
import ContactPage from "./pages/contact/page.tsx";
import PricingPage from "./pages/pricing/page.tsx";
import AboutPage from "./pages/about/page.tsx";
import WorkPage from "./pages/work/page.tsx";
import CaseStudyDetailPage from "./pages/work/[slug].tsx";
import BlogPage from "./pages/blog/page.tsx";
import BlogPostPage from "./pages/blog/[slug].tsx";
import NotFound from "./pages/NotFound.tsx";

// Hosting pages
import HostingPage from "./pages/hosting/page.tsx";
import SharedHostingPage from "./pages/hosting/shared/page.tsx";
import WordPressHostingPage from "./pages/hosting/wordpress/page.tsx";
import VpsHostingPage from "./pages/hosting/vps/page.tsx";
import VdsHostingPage from "./pages/hosting/vds/page.tsx";
import DedicatedServersHostingPage from "./pages/hosting/dedicated-servers/page.tsx";
import DomainsPage from "./pages/hosting/domains/page.tsx";
import BusinessEmailPage from "./pages/hosting/email/page.tsx";
import SslPage from "./pages/hosting/ssl/page.tsx";

// Marketing & Branding service pages
import BrandIdentityPage from "./pages/services/brand-identity/page.tsx";
import WebsiteDesignPage from "./pages/services/website-design/page.tsx";
import EcommercePage from "./pages/services/ecommerce/page.tsx";
import SeoPage from "./pages/services/seo/page.tsx";
import PaidAdsPage from "./pages/services/paid-ads/page.tsx";
import SocialMediaPage from "./pages/services/social-media/page.tsx";
import ZeepoAiPage from "./pages/services/zeepo-ai/page.tsx";
import EmailMarketingPage from "./pages/services/email-marketing/page.tsx";

import SecurityPage from "./pages/security/page.tsx";
import EmailSecurityPage from "./pages/security/email/page.tsx";
import SslCertificatePage from "./pages/security/ssl/page.tsx";
import CartPage from "./pages/cart/page.tsx";

import HelpCentrePage from "./pages/help/page.tsx";
import WhoisPage from "./pages/whois/page.tsx";
import DomainTransferPage from "./pages/domain-transfer/page.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import FloatingActionButton from "./components/FloatingActionButton.tsx";

// Legal pages
import TermsOfServicePage from "./pages/legal/terms/page.tsx";
import PrivacyPolicyPage from "./pages/legal/privacy/page.tsx";
import CookiePolicyPage from "./pages/legal/cookies/page.tsx";

function AppRoutes() {
  const { pathname } = useLocation();
  const hideFab = pathname === "/cart";

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/marketing" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/work/:slug" element={<CaseStudyDetailPage />} />
        {/* Hosting routes */}
        <Route path="/hosting" element={<HostingPage />} />
        <Route path="/hosting/shared" element={<SharedHostingPage />} />
        <Route path="/hosting/wordpress" element={<WordPressHostingPage />} />
        <Route path="/hosting/vps" element={<VpsHostingPage />} />
        <Route path="/hosting/vds" element={<VdsHostingPage />} />
        <Route path="/hosting/dedicated-servers" element={<DedicatedServersHostingPage />} />
        <Route path="/hosting/domains" element={<DomainsPage />} />
        <Route path="/hosting/email" element={<BusinessEmailPage />} />
        <Route path="/hosting/ssl" element={<SslPage />} />

        {/* Marketing and Branding routes */}
        <Route path="/services/brand-identity" element={<BrandIdentityPage />} />
        <Route path="/services/website-design" element={<WebsiteDesignPage />} />
        <Route path="/services/ecommerce" element={<EcommercePage />} />
        <Route path="/services/seo" element={<SeoPage />} />
        <Route path="/services/paid-ads" element={<PaidAdsPage />} />
        <Route path="/services/social-media" element={<SocialMediaPage />} />
        <Route path="/services/zeepo-ai" element={<ZeepoAiPage />} />
        <Route path="/services/email-marketing" element={<EmailMarketingPage />} />

        {/* Help Centre */}
        <Route path="/help" element={<HelpCentrePage />} />

        {/* WHOIS Checker */}
        <Route path="/whois" element={<WhoisPage />} />

        {/* Domain Transfer */}
        <Route path="/domain-transfer" element={<DomainTransferPage />} />

        {/* Security */}
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/security/email" element={<EmailSecurityPage />} />
        <Route path="/security/ssl" element={<SslCertificatePage />} />

        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Shared cart / checkout page */}
        <Route path="/cart" element={<CartPage />} />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideFab && <FloatingActionButton />}
    </>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <AppRoutes />
        <Analytics />
      </BrowserRouter>
    </DefaultProviders>
  );
}
