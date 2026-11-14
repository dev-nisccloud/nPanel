import { lazy, Suspense, useLayoutEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PERMANENT_REDIRECTS } from "./lib/public-routes.ts";
import { applyPageMeta } from "./lib/seo.ts";
import { ROUTE_META } from "./lib/route-meta.ts";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ThemeProvider } from "./components/providers/theme.tsx";
import { isComingSoonEnabled } from "./lib/coming-soon.ts";
import ComingSoonPage from "./pages/coming-soon/page.tsx";
import Index from "./pages/Index.tsx";
const ServicesPage = lazy(() => import("./pages/services/page.tsx"));
const ContactPage = lazy(() => import("./pages/contact/page.tsx"));
const PricingPage = lazy(() => import("./pages/pricing/page.tsx"));
const AboutPage = lazy(() => import("./pages/about/page.tsx"));
const CareersPage = lazy(() => import("./pages/careers/page.tsx"));
const CareerJobPage = lazy(() => import("./pages/careers/job-page.tsx"));
const ComparePage = lazy(() => import("./pages/compare/page.tsx"));
const StatusPage = lazy(() => import("./pages/status/page.tsx"));
const PlatformPage = lazy(() => import("./pages/platform/page.tsx"));
const WorkPage = lazy(() => import("./pages/work/page.tsx"));
const BlogPage = lazy(() => import("./pages/blog/page.tsx"));
const BlogPostPage = lazy(() => import("./pages/blog/[slug].tsx"));
import NotFound from "./pages/NotFound.tsx";

const HybridEmailPage = lazy(
  () => import("./pages/hosting/hybrid-email/page.tsx"),
);

const AgencyHostingPage = lazy(() => import("./pages/hosting/agency/page.tsx"));

const Microsoft365Page = lazy(() => import("./pages/hosting/microsoft-365/page.tsx"));
const GoogleWorkspacePage = lazy(() => import("./pages/hosting/google-workspace/page.tsx"));
const TransferHostingPage = lazy(() => import("./pages/hosting/transfer/page.tsx"));
// Hosting pages
const HostingPage = lazy(() => import("./pages/hosting/page.tsx"));
const WebHostingPage = lazy(() => import("./pages/hosting/shared/page.tsx"));
const WordPressHostingPage = lazy(
  () => import("./pages/hosting/wordpress/page.tsx"),
);
const VpsHostingPage = lazy(() => import("./pages/hosting/vps/page.tsx"));
const VdsHostingPage = lazy(() => import("./pages/hosting/vds/page.tsx"));
const DedicatedServersHostingPage = lazy(
  () => import("./pages/hosting/dedicated-servers/page.tsx"),
);
const DomainsPage = lazy(() => import("./pages/hosting/domains/page.tsx"));
const BusinessEmailPage = lazy(() => import("./pages/hosting/email/page.tsx"));
const SslPage = lazy(() => import("./pages/hosting/ssl/page.tsx"));

// Marketing & Branding service pages
const BrandIdentityPage = lazy(
  () => import("./pages/services/brand-identity/page.tsx"),
);
const WebsiteDesignPage = lazy(
  () => import("./pages/services/website-design/page.tsx"),
);
const EcommercePage = lazy(() => import("./pages/services/ecommerce/page.tsx"));
const SoftwarePage = lazy(() => import("./pages/services/software/page.tsx"));
const SeoPage = lazy(() => import("./pages/services/seo/page.tsx"));
const PaidAdsPage = lazy(() => import("./pages/services/paid-ads/page.tsx"));
const SocialMediaPage = lazy(
  () => import("./pages/services/social-media/page.tsx"),
);
const ZeepoAiPage = lazy(() => import("./pages/services/zeepo-ai/page.tsx"));
const EmailMarketingPage = lazy(
  () => import("./pages/services/email-marketing/page.tsx"),
);

const SecurityPage = lazy(() => import("./pages/security/page.tsx"));
const EmailSecurityPage = lazy(() => import("./pages/security/email/page.tsx"));
const SslCertificatePage = lazy(() => import("./pages/security/ssl/page.tsx"));
const MalwareRemovalPage = lazy(
  () => import("./pages/security/malware-removal/page.tsx"),
);
const WebsiteMaintenancePage = lazy(
  () => import("./pages/security/website-maintenance/page.tsx"),
);
const CartPage = lazy(() => import("./pages/cart/page.tsx"));

const HelpCentrePage = lazy(() => import("./pages/help/page.tsx"));
const WhoisPage = lazy(() => import("./pages/whois/page.tsx"));
const DomainTransferPage = lazy(
  () => import("./pages/domain-transfer/page.tsx"),
);
import ScrollToTop from "./components/ScrollToTop.tsx";
import FloatingActionButton from "./components/FloatingActionButton.tsx";
import PageLoader, { InitialPageReady } from "./components/PageLoader.tsx";

// Legal pages
const TermsOfServicePage = lazy(() => import("./pages/legal/terms/page.tsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/legal/privacy/page.tsx"));
const CookiePolicyPage = lazy(() => import("./pages/legal/cookies/page.tsx"));
const LegalCentrePage = lazy(() => import("./pages/legal/page.tsx"));
const ServiceLevelAgreementPage = lazy(() => import("./pages/legal/sla/page.tsx"));
const AcceptableUsePolicyPage = lazy(() => import("./pages/legal/acceptable-use/page.tsx"));
const DataProcessingAddendumPage = lazy(() => import("./pages/legal/dpa/page.tsx"));

// Development-only artwork contact sheet (export source for design/illustration-library).
const ArtworkLibraryPage = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/ArtworkLibraryPage.tsx"))
  : null;
const SectionPreviewPage = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/SectionPreviewPage.tsx"))
  : null;

/**
 * Applies table-driven metadata for routes that do not set their own.
 * Runs before page effects so page-level `usePageMeta` calls win.
 */
function RouteMeta() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const key = pathname.replace(/\/+$/, "") || "/";
    const meta = ROUTE_META[key];
    if (meta) applyPageMeta(meta);
  }, [pathname]);
  return null;
}

function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
}

export function AppRoutes() {
  const { pathname } = useLocation();
  const hideFab = pathname === "/cart";

  return (
    <>
      <RouteMeta />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/marketing" element={<Navigate to="/services" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/careers/:slug" element={<CareerJobPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/work" element={<WorkPage />} />
          {/* Hosting routes */}
          <Route path="/hosting" element={<HostingPage />} />
<Route path="/hosting/microsoft-365" element={<Microsoft365Page />} />
<Route path="/hosting/google-workspace" element={<GoogleWorkspacePage />} />
<Route path="/hosting/transfer" element={<TransferHostingPage />} />
          <Route path="/hosting/agency" element={<AgencyHostingPage />} />
          <Route path="/hosting/web-hosting" element={<WebHostingPage />} />
          <Route path="/hosting/wordpress" element={<WordPressHostingPage />} />
          <Route path="/hosting/vps" element={<VpsHostingPage />} />
          <Route path="/hosting/vds" element={<VdsHostingPage />} />
          <Route
            path="/hosting/dedicated-servers"
            element={<DedicatedServersHostingPage />}
          />
          <Route path="/hosting/domains" element={<DomainsPage />} />
          <Route path="/hosting/hybrid-email" element={<HybridEmailPage />} />
          <Route path="/hosting/email" element={<BusinessEmailPage />} />
          <Route path="/hosting/ssl" element={<SslPage />} />

          {/* Marketing and Branding routes */}
          <Route
            path="/services/brand-identity"
            element={<BrandIdentityPage />}
          />
          <Route
            path="/services/website-design"
            element={<WebsiteDesignPage />}
          />
          <Route path="/services/ecommerce" element={<EcommercePage />} />
          <Route path="/services/software" element={<SoftwarePage />} />
          <Route path="/services/seo" element={<SeoPage />} />
          <Route path="/services/paid-ads" element={<PaidAdsPage />} />
          <Route path="/services/social-media" element={<SocialMediaPage />} />
          <Route path="/services/zepo-ai" element={<ZeepoAiPage />} />
          <Route
            path="/services/email-marketing"
            element={<EmailMarketingPage />}
          />

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
          <Route
            path="/security/malware-removal"
            element={<MalwareRemovalPage />}
          />
          <Route
            path="/security/website-maintenance"
            element={<WebsiteMaintenancePage />}
          />

          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {Object.entries(PERMANENT_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
          ))}

          {/* Shared cart / checkout page */}
          <Route path="/cart" element={<CartPage />} />

          {/* Legal pages */}
          <Route path="/legal" element={<LegalCentrePage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/sla" element={<ServiceLevelAgreementPage />} />
          <Route path="/acceptable-use" element={<AcceptableUsePolicyPage />} />
          <Route path="/dpa" element={<DataProcessingAddendumPage />} />

          {ArtworkLibraryPage && (
            <Route path="/__artwork-library" element={<ArtworkLibraryPage />} />
          )}
          {SectionPreviewPage && (
            <Route path="/__section-preview" element={<SectionPreviewPage />} />
          )}

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <InitialPageReady />
      </Suspense>
      {!hideFab && <FloatingActionButton />}
    </>
  );
}

export default function App() {
  if (isComingSoonEnabled()) {
    return (
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ComingSoonPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  return (
    <DefaultProviders>
      <BrowserRouter>
        <AppRoutes />
        <Analytics />
      </BrowserRouter>
    </DefaultProviders>
  );
}
