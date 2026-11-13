import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { WEBSITE_DESIGN_PLANS, SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import {
  Monitor,
  Smartphone,
  Code2,
  Zap,
  Globe,
  ShoppingBag,
  Lock,
  BarChart2,
} from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { Highlight, StepSpotlight } from "@/components/signature/index.ts";
import { CodePipelineArt } from "@/components/artwork/build-art.tsx";
import { FlaskConical, Rocket } from "lucide-react";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Speed & Performance",
    headline: "A lighter experience for everyday connections",
    body: "We reduce avoidable page weight and test key templates across screen sizes before launch. Actual load time and PageSpeed results still depend on content, third-party scripts, hosting, device, and network conditions.",
    bullets: [
      "Responsive images, lazy loading, and sensible script budgets",
      "Lab checks on representative pages before launch",
      "Performance findings documented for the agreed scope",
    ],
    mockupRight: true,
    visual: "speed",
  },
  {
    tag: "Conversion Architecture",
    id: "website-artwork",
    artwork: (
      <img
        src="/artwork/website-design-clean.svg"
        alt="Website design composition showing a visual page editor"
        width={586}
        height={562}
        loading="lazy"
        className="mx-auto h-auto w-full max-w-[560px] object-contain"
      />
    ),
    headline: "Built to turn browsers into buyers",
    body: "We map a clear next step for each important page, whether that is an enquiry, call, quote request, or purchase. The result is a site structured around customer decisions instead of decoration alone.",
    bullets: [
      "Calls to action matched to page intent",
      "Forms and contact options agreed during discovery",
      "Tracking points defined for meaningful enquiries",
    ],
    mockupRight: false,
    visual: "funnel",
  },
  {
    tag: "SEO-Ready from Day One",
    headline: "A technical foundation search engines can read",
    body: "Site structure, page hierarchy, crawl signals, and metadata are considered during the build rather than added as an afterthought. This creates a sound starting point; rankings still depend on competition, content, authority, and ongoing work.",
    bullets: [
      "Heading structure, canonical tags, and relevant schema",
      "XML sitemap and launch-time indexing checks",
      "On-page setup for the priority pages in scope",
    ],
    mockupRight: true,
    visual: "growth",
  },
];

export default function WebsiteDesignPage() {
  return (
    <ServicePageShell
      badge="Website Design & Development"
      headline={
        <>
          Websites that turn
          {" "}<br />
          <span className="text-primary">visitors into customers</span>
        </>
      }
      subtext="A beautiful website means little if it does not convert. We design and build fast, mobile-first websites that help people find you, trust you, and get in touch."
      serviceType="marketing"
      checkoutServiceType="website_design"
      checkoutProductName="Website Design"
      heroImage={niscWebsiteImage("website_design_development.png")}
      heroImageStandalone
      trustStats={[
        { value: "Scoped", label: "Project Proposal" },
        { value: "Tested", label: "Before Launch" },
        { value: "Responsive", label: "Mobile to Desktop" },
        { value: "Guided", label: "Handover" },
      ]}
      features={[
        {
          icon: <Monitor size={20} />,
          title: "Purpose-built page design",
          desc: "Key page layouts are designed around your content, audience, and actions before development begins, so you can review the direction early.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile-first development",
          desc: "Most visitors browse on mobile. Every site we build is optimised for mobile screens, touch interactions, and slower connections.",
        },
        {
          icon: <Code2 size={20} />,
          title: "Clean, semantic code",
          desc: "React or an appropriate CMS is selected around your editing needs. Semantic structure supports accessibility, maintenance, and search-engine understanding.",
        },
        {
          icon: <Zap size={20} />,
          title: "Performance-conscious build",
          desc: "Image optimisation, lazy loading, caching, and script restraint are applied where suitable. Measured results vary with hosting, content, integrations, devices, and networks.",
        },
        {
          icon: <Globe size={20} />,
          title: "On-page SEO built-in",
          desc: "Every page is built with proper title tags, meta descriptions, structured data, sitemap, and Core Web Vitals in mind from day one.",
        },
        {
          icon: <ShoppingBag size={20} />,
          title: "Clear enquiry paths",
          desc: "Calls to action, forms, and optional contact integrations are arranged around the next step you want qualified visitors to take.",
        },
        {
          icon: <Lock size={20} />,
          title: "Security basics planned",
          desc: "HTTPS, access controls, updates, backups, and hosting protections are documented according to the selected platform and service scope.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Analytics & tracking",
          desc: "Agreed analytics and advertising tags can be configured so your team can inspect traffic and enquiry events, subject to consent and platform settings.",
        },
      ]}
      plans={WEBSITE_DESIGN_PLANS}
      addons={[
        {
          id: "web-copywriting",
          label: "Professional Website Copywriting",
          price: 20000,
          period: "once",
        },
        {
          id: "web-maintenance",
          label: "Monthly Website Maintenance",
          price: 8000,
          period: "month",
        },
        {
          id: "web-speedaudit",
          label: "Website Speed & Security Audit",
          price: 12000,
          period: "once",
        },
      ]}
      process={[
        {
          num: "01",
          title: "Discovery & wireframe",
          desc: "We map your user journey, define your site structure, and build wireframes showing how every page will flow before design begins.",
        },
        {
          num: "02",
          title: "Design in Figma",
          desc: "Full visual designs are created and shared with you for approval. You see the finished look before development begins.",
        },
        {
          num: "03",
          title: "Build & optimise",
          desc: "We build the approved pages, connect the integrations in scope, and test representative journeys across mobile, tablet, and desktop.",
        },
        {
          num: "04",
          title: "Launch & handover",
          desc: "After approval, we deploy to the agreed environment, complete launch checks, and show your team how to manage the parts included in the handover.",
        },
      ]}
      contentSlots={{
        afterShowcase: (
          <StepSpotlight
            id="build-and-test"
            tone="dark"
            artSide="left"
            eyebrow="Under the hood"
            title={<>Built properly, <Highlight>tested before launch</Highlight></>}
            intro="Behind every page is code that has to work on the day it goes live. We build the approved design, connect the integrations in scope and check the journeys that matter before anything is published."
            steps={[
              { icon: Code2, title: "Build", text: "We build the approved pages and connect the integrations agreed in your proposal." },
              { icon: FlaskConical, title: "Test", text: "Representative journeys are tested across mobile, tablet and desktop." },
              { icon: Rocket, title: "Launch", text: "After your approval we publish the site and walk you through the handover." },
            ]}
            framed={false}
            art={<CodePipelineArt />}
            artLabel="Illustration of code being written, tested and deployed"
          />
        ),
      }}
      whyPoints={[
        {
          title: "Decisions before decoration",
          desc: "Navigation, page order, and calls to action begin with what customers need to understand and do, giving design choices a clear purpose.",
          visual: "mobile",
        },
        {
          title: "No page builders",
          desc: "Where a custom build is agreed, you are not boxed into a generic hosted-site template. We select the implementation approach during discovery.",
          visual: "code",
        },
        {
          title: "SEO-ready from day one",
          desc: "Search structure is considered during planning, reducing avoidable technical rework without promising a particular ranking or traffic result.",
          visual: "growth",
        },
        {
          title: "Conversion architecture",
          desc: "Priority pages are matched to a defined buyer question and next action, making the journey easier to evaluate and improve after launch.",
          visual: "funnel",
        },
        {
          title: "Scope before commitment",
          desc: "The proposal records deliverables, assumptions, price, and an estimated schedule. Changes, delayed content, or added integrations are agreed separately.",
          visual: "pricing",
        },
        {
          title: "A defined handover",
          desc: "Training, launch checks, and any post-launch assistance follow the selected plan or proposal, so ownership and support boundaries are clear.",
          visual: "support",
        },
      ]}
      faqs={[
        {
          q: "How long does it take to build a website?",
          a: "Typical planning estimates are about 10 days for an Essential site, 14 days for Professional, and 21 days for Enterprise. Your proposal confirms the estimate after scope review; content, feedback, integrations, and changes can affect it.",
        },
        {
          q: "Do I need to provide the content?",
          a: "You provide the basic information about your business. We offer professional copywriting as an add-on (KES 20,000) if you want us to write clear web copy that helps visitors take action.",
        },
        {
          q: "Will my website help me get found on Google?",
          a: "We include the on-page and technical foundations in your scope, such as page structure, metadata, and relevant schema. These help search engines understand the site but do not guarantee rankings; ongoing content and authority work may be needed.",
        },
        {
          q: "What platform will my website be built on?",
          a: "Depending on your needs: React (fast and flexible), WordPress (easiest for self-management), or a headless CMS. We recommend the best platform for your goals during discovery.",
        },
        {
          q: "Can I update the website myself after launch?",
          a: "That depends on the agreed platform. CMS builds can include editor access and handover training; custom React updates may require a maintenance arrangement or a separately scoped content interface.",
        },
        {
          q: "Do you provide hosting?",
          a: "Yes. We can recommend and configure an appropriate Nisc Cloud hosting option. Hosting is priced separately, and performance and support terms follow the selected hosting plan.",
        },
      ]}
      ctaHeadline="Let's build a website that works harder"
      ctaSubtext="Plan a website around the questions your customers ask, the actions you want them to take, and a scope your team can review before work begins."
      pricingNote={SERVICE_PACKAGE_NOTES.WEBSITE_DESIGN}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
