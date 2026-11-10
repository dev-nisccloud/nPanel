import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Archive, Globe, KeyRound, Layers, Network, ShieldCheck } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { HostingHeroIllustration, vpsHeroConfig } from "../_components/HostingHeroIllustration.tsx";
import { VpsPlansSection } from "./_components/VpsPlansSection.tsx";
import { VpsComparison, VpsExplained, VpsGettingStarted, VpsPlanFit } from "./_components/vps-content.tsx";
import { CloudServersStory } from "@/components/artwork/npanel-stories";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Your server, in nPanel",
    artwork: <CloudServersStory />,
    caption: false,
    headline: "Order, set up and manage your server in one place.",
    body: "Pick a size and location, choose your operating system and add your SSH key. Your VPS then sits in nPanel next to your domains, email and invoices.",
    bullets: ["Linux distributions or Windows Server", "SSH key login from the first boot", "Servers, domains and invoices in one account"],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "What people run on a VPS",
    headline: "Room for the software web hosting cannot run.",
    body: "With root access you can install any language, database or service, run background jobs and open the ports your project needs.",
    bullets: [
      "Node.js, Python, PHP and Go applications",
      "APIs, bots, queues and scheduled jobs",
      "Databases, staging servers and self-hosted tools",
    ],
    mockupRight: false,
    visual: "workloads",
  },
];

export default function VpsHostingPage() {
  return (
    <ServicePageShell
      badge="VPS Servers"
      headline={
        <>
          Your own virtual server, with <span className="text-primary">full root access</span> and 10TB of bandwidth
        </>
      }
      subtext="Run apps, APIs, stores and developer projects on a VPS with SSH key login, DDoS protection, backups and a dedicated IPv4 address. Choose Linux or Windows Server and manage it in nPanel."
      serviceType="hosting"
      heroIllustration={<HostingHeroIllustration config={vpsHeroConfig} />}
      heroIllustrationBare
      showHeroOverlays={false}
      trustStats={[
        { value: "Root", label: "Full Access" },
        { value: "10TB", label: "Bandwidth, 1Gbps Port" },
        { value: "IPv4", label: "Dedicated Address" },
        { value: "DDoS", label: "Protection Included" },
      ]}
      features={[
        {
          icon: <KeyRound size={20} />,
          title: "Full Root Access and SSH Keys",
          desc: "Sign in as root with your SSH key and configure the server exactly as your project needs.",
        },
        {
          icon: <Layers size={20} />,
          title: "Linux or Windows Server",
          desc: "Choose a Linux distribution or Windows Server when you set up your VPS.",
        },
        {
          icon: <ShieldCheck size={20} />,
          title: "DDoS Protection",
          desc: "Every plan is protected against floods of fake traffic that try to take servers offline.",
        },
        {
          icon: <Archive size={20} />,
          title: "Backups Included",
          desc: "Backups come with every plan. Keep your own copies of critical data as well.",
        },
        {
          icon: <Globe size={20} />,
          title: "Dedicated IPv4 Address",
          desc: "Your server gets its own public IPv4 address to point your domains and services at.",
        },
        {
          icon: <Network size={20} />,
          title: "10TB Bandwidth on a 1Gbps Port",
          desc: "Every size includes 10TB of monthly data transfer on a 1Gbps network port.",
        },
      ]}
      plansUnderHero
      customPlansSection={<VpsPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Choose a Size and Location", desc: "Compare sizes by cores and memory, and pick a server location on the card." },
        { num: "02", title: "Pick Your Operating System", desc: "Choose a Linux distribution or Windows Server and add your SSH public key." },
        { num: "03", title: "Sign In and Set Up", desc: "Connect over SSH as root, update the system and install your stack." },
        { num: "04", title: "Grow When You Need To", desc: "Move to a larger VPS, a VDS or a dedicated server as your workload grows." },
      ]}
      whyPoints={[
        { title: "Control Web Hosting Cannot Give", visual: "code", desc: "Install any software, run background jobs and open the ports your project needs." },
        { title: "Protected From Day One", visual: "security", desc: "DDoS protection and backups are included on every size." },
        { title: "A Clear Path Up", visual: "growth", desc: "Start small, then move to a larger VPS, a VDS or dedicated hardware without changing provider." },
        { title: "One Account for Everything", visual: "integrate", desc: "Your servers sit in nPanel with your domains, email and invoices." },
      ]}
      whySectionHeadline="Why developers and businesses choose a Nisc Cloud VPS"
      whySectionVariant="simple"
      contentSlots={{
        afterPricing: <VpsPlanFit />,
        afterShowcase: <VpsComparison />,
        afterProcess: <VpsGettingStarted />,
        beforeFaq: <VpsExplained />,
      }}
      faqTitle="VPS questions"
      faqs={[
        {
          q: "What is included with every VPS?",
          a: "Every VPS includes full root access, SSH key login, a choice of Linux distributions or Windows Server, DDoS protection, backups, a dedicated IPv4 address and 10TB of bandwidth on a 1Gbps port.",
        },
        {
          q: "Is the VPS managed?",
          a: "No. A VPS is unmanaged: you look after the operating system, updates and the software you install. If you want the server managed for you, choose Web Hosting or WordPress Hosting.",
        },
        {
          q: "Which operating systems can I choose?",
          a: "You can choose from available Linux distributions or Windows Server when you set up the VPS. The current list is shown during configuration.",
        },
        {
          q: "Where are the servers located?",
          a: "Each plan card lists the locations available for that size, currently in the United States. Choose a location on the card before checkout.",
        },
        {
          q: "Will a US server be slow for visitors in Kenya?",
          a: "Distance adds a small delay. It matters little for APIs, background work and development, and for public websites a CDN in front of the server serves pages and images from closer to your visitors.",
        },
        {
          q: "Which size should I choose?",
          a: "Start with memory: 4 GB suits small apps and staging servers, 8 GB suits most websites, stores and APIs, and 16 GB or more suits databases and several apps on one server.",
        },
        {
          q: "Can I upgrade my VPS later?",
          a: "Yes. Contact us to move to a larger size, or to a VDS or dedicated server when you need reserved or physical resources.",
        },
        {
          q: "Do I get a dedicated IP address?",
          a: "Yes. Every VPS includes its own dedicated IPv4 address.",
        },
        {
          q: "Can I run Docker on my VPS?",
          a: "Yes. With root access you can install Docker and other container tools, as long as your workload fits the size you choose and follows our Acceptable Use Policy.",
        },
        {
          q: "Are backups included?",
          a: "Yes. Backups are included with every plan. For important data, keep your own copies as well, such as database dumps stored off the server.",
        },
        {
          q: "Is there DDoS protection?",
          a: "Yes. Every VPS includes DDoS protection against floods of fake traffic.",
        },
        {
          q: "How much bandwidth do I get?",
          a: "Every size includes 10TB of data transfer per month on a 1Gbps port.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Prices can differ by server location."
      ctaHeadline="Your own server, ready for whatever you build"
      ctaSubtext="Full root access, DDoS protection, backups and 10TB of bandwidth on every size, managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
