import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Cpu, HardDrive, MapPin, Network, Server, Settings } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { CloudServersStory } from "@/components/artwork/npanel-stories";
import { ReservedCoresArt } from "./_components/ReservedCoresArt.tsx";
import { VdsPlansSection } from "./_components/VdsPlansSection.tsx";
import { VdsComparison, VdsExplained, VdsGettingStarted, VdsPlanFit } from "./_components/vds-content.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Your server, in nPanel",
    artwork: <CloudServersStory />,
    caption: false,
    headline: "Your reserved server, next to your domains and email.",
    body: "Order a size and a location, then manage the server in nPanel with the rest of your account.",
    bullets: ["Dedicated vCPU cores on every size", "10TB of bandwidth on a 1Gbps port", "Servers, domains and invoices in one account"],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "When reserved cores help",
    headline: "For work that cannot wait its turn on a shared core.",
    body: "A VDS keeps its virtual CPU cores for your server. That suits production apps and databases that slow down when a VPS has to share the processor.",
    bullets: [
      "Stores and APIs with steady traffic",
      "Databases that should not compete for cores",
      "A step up from VPS, short of a whole machine",
    ],
    mockupRight: false,
    visual: "workloads",
  },
];

export default function VdsHostingPage() {
  return (
    <ServicePageShell
      badge="VDS Servers"
      headline={
        <>
          Virtual cores <span className="text-primary">reserved for your server</span>, with 10TB of bandwidth
        </>
      }
      subtext="A VDS keeps its vCPU cores for you, so other customers do not share them. Choose a size and a location, then manage the operating system yourself."
      serviceType="hosting"
      heroIllustration={<ReservedCoresArt />}
      heroIllustrationBare
      showHeroOverlays={false}
      trustStats={[
        { value: "vCPU", label: "Dedicated cores" },
        { value: "10TB", label: "Bandwidth, 1Gbps port" },
        { value: "You", label: "Manage the OS" },
        { value: "nPanel", label: "Servers and billing" },
      ]}
      features={[
        {
          icon: <Cpu size={20} />,
          title: "Dedicated vCPU cores",
          desc: "The processor cores on every VDS are dedicated virtual cores, held for your server.",
        },
        {
          icon: <Server size={20} />,
          title: "A clear step up from VPS",
          desc: "Choose a VDS when a virtual server is right, but the cores need to stay yours.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Memory and storage on the card",
          desc: "Each size shows its memory and storage. Current sizes run from 4 GB to 16 GB of memory.",
        },
        {
          icon: <Network size={20} />,
          title: "10TB bandwidth on a 1Gbps port",
          desc: "Every size includes 10TB of monthly data transfer on a 1Gbps network port.",
        },
        {
          icon: <MapPin size={20} />,
          title: "Choose a server location",
          desc: "Each card lists the cities where that size is in stock. The price follows the city you pick.",
        },
        {
          icon: <Settings size={20} />,
          title: "You manage the operating system",
          desc: "Install your own stack and keep it updated. The operating systems available are shown when you configure the server.",
        },
      ]}
      plansUnderHero
      customPlansSection={<VdsPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Choose a size and a city", desc: "Compare dedicated cores and memory, then pick a location on the card." },
        { num: "02", title: "Pick an operating system", desc: "Choose from the operating systems shown for that server during setup." },
        { num: "03", title: "Sign in and install", desc: "The server appears in nPanel. Sign in and install the software you need." },
        { num: "04", title: "Move up when you outgrow it", desc: "Choose a larger VDS, or a dedicated server when you need a physical machine." },
      ]}
      whyPoints={[
        { title: "Cores that stay yours", visual: "speed", desc: "Dedicated vCPU cores are held for your server instead of being shared." },
        { title: "Steadier than a busy VPS", visual: "deploy", desc: "Use a VDS when production apps or databases need performance that does not dip when the host is busy." },
        { title: "A path to a physical server", visual: "growth", desc: "Start on a VDS, then move to a dedicated server when the workload needs the whole machine." },
        { title: "One account for everything", visual: "integrate", desc: "Your server sits in nPanel with your domains, email and invoices." },
      ]}
      whySectionHeadline="Why teams choose a Nisc Cloud VDS"
      whySectionVariant="simple"
      contentSlots={{
        afterPricing: <VdsPlanFit />,
        afterShowcase: <VdsComparison />,
        afterProcess: <VdsGettingStarted />,
        beforeFaq: <VdsExplained />,
      }}
      faqTitle="VDS questions"
      faqs={[
        {
          q: "What is a VDS?",
          a: "A VDS (virtual dedicated server) is a virtual server with dedicated vCPU cores. Those cores are held for your server. You manage the operating system.",
        },
        {
          q: "How is a VDS different from a VPS?",
          a: "Both are virtual servers you manage. On a VDS the vCPU cores are dedicated to you, so other customers do not share them. A VPS is the smaller, more flexible starting point.",
        },
        {
          q: "What is included with every VDS?",
          a: "Every VDS includes dedicated vCPU cores, the memory and storage shown on the card, and 10TB of bandwidth on a 1Gbps port. You manage the operating system.",
        },
        {
          q: "Is the VDS managed?",
          a: "No. You look after the operating system, updates and the software you install. If you want the server managed for you, choose Web Hosting or WordPress Hosting.",
        },
        {
          q: "Which size should I choose?",
          a: "2 dedicated cores and 4 GB of memory suit a single app. 4 cores and 8 GB suit most production apps and stores. 8 cores and 16 GB suit heavier databases and several services.",
        },
        {
          q: "Where are the servers located?",
          a: "Each plan card lists the cities where that size is in stock. Choose a city on the card before checkout. Prices can differ by city.",
        },
        {
          q: "Will a distant server be slow for visitors in Kenya?",
          a: "Distance adds a small delay. It matters little for APIs and background work. For a public website, a CDN in front of the server serves pages and images from closer to your visitors.",
        },
        {
          q: "Can I upgrade my VDS later?",
          a: "Contact us to move to a larger VDS, or to a dedicated server when you need a physical machine.",
        },
        {
          q: "Which operating systems can I choose?",
          a: "The operating systems available for that server are shown when you configure it. You manage whichever system you choose.",
        },
        {
          q: "Can I install my own software?",
          a: "Yes. You manage the server, so you can install the languages, databases and tools your project needs, as long as the workload fits the size and follows our Acceptable Use Policy.",
        },
        {
          q: "How much bandwidth do I get?",
          a: "Every size includes 10TB of data transfer per month on a 1Gbps port.",
        },
        {
          q: "What does dedicated vCPU mean?",
          a: "It means the virtual processor cores on your VDS are reserved for your server. Other customers' servers do not run on those cores.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Prices can differ by server location."
      ctaHeadline="Reserved cores, ready for production"
      ctaSubtext="Dedicated vCPU cores and 10TB of bandwidth on every size, managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
