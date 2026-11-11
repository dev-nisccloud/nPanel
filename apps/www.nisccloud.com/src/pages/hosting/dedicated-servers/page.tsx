import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Cpu, HardDrive, MapPin, Network, Server, Settings } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { CloudServersStory } from "@/components/artwork/npanel-stories";
import { ChassisPowerArt } from "./_components/ChassisPowerArt.tsx";
import { DedicatedPlansSection } from "./_components/DedicatedPlansSection.tsx";
import {
  DedicatedComparison,
  DedicatedExplained,
  DedicatedGettingStarted,
  DedicatedPlanFit,
} from "./_components/dedicated-content.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Your machine, in nPanel",
    artwork: <CloudServersStory />,
    caption: false,
    headline: "A whole machine, in the same account as your domains.",
    body: "Choose a physical server and a city. It then sits in nPanel with your domains, email and invoices.",
    bullets: ["The CPU, memory and disks on the card are yours alone", "Bandwidth and port speed shown on the card", "Servers, domains and invoices in one account"],
    mockupRight: true,
    visual: "serverMonitor",
  },
  {
    tag: "When a virtual server is not enough",
    headline: "For workloads that need the hardware itself.",
    body: "Use a dedicated server when you need a named processor, a large amount of memory, or disks that are not a virtual volume.",
    bullets: [
      "Databases that need a lot of memory and fast disks",
      "Applications that must not share a processor",
      "Builds with 1Gbps or 10Gbps ports, shown on the card",
    ],
    mockupRight: false,
    visual: "bareMetal",
  },
];

export default function DedicatedServersHostingPage() {
  return (
    <ServicePageShell
      badge="Dedicated Servers"
      headline={
        <>
          A physical server <span className="text-primary">used only by you</span>
        </>
      }
      subtext="Rent a whole machine: its processor, memory and disks are not shared. Pick a build and a city, then manage the operating system yourself."
      serviceType="hosting"
      heroIllustration={<ChassisPowerArt />}
      heroIllustrationBare
      showHeroOverlays={false}
      trustStats={[
        { value: "1:1", label: "Your own machine" },
        { value: "Port", label: "Speed on each card" },
        { value: "You", label: "Manage the OS" },
        { value: "nPanel", label: "Servers and billing" },
      ]}
      features={[
        {
          icon: <Server size={20} />,
          title: "A physical server for one customer",
          desc: "The processor, memory and disks on the card are used by your server, not split with another customer.",
        },
        {
          icon: <Cpu size={20} />,
          title: "The processor is named",
          desc: "Each machine shows its CPU model, cores and threads, so you can match it to your workload.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "Disks listed on the card",
          desc: "Storage can be SSD, NVMe, HDD, or a mix. The card shows the disks that machine actually has.",
        },
        {
          icon: <Network size={20} />,
          title: "Bandwidth and port on the card",
          desc: "Monthly transfer and port speed are listed on each machine. They are not the same on every server.",
        },
        {
          icon: <MapPin size={20} />,
          title: "Choose the city",
          desc: "The same build is sometimes in stock in more than one city. The price follows the city you pick.",
        },
        {
          icon: <Settings size={20} />,
          title: "You manage the operating system",
          desc: "Install your own stack and keep it updated. The operating systems available are shown when you configure the machine.",
        },
      ]}
      plansUnderHero
      customPlansSection={<DedicatedPlansSection />}
      plans={[]}
      process={[
        { num: "01", title: "Filter by cores", desc: "Narrow the list, then read the CPU, memory, disks and port on the row." },
        { num: "02", title: "Pick a city", desc: "Choose a city where that machine is in stock. The price updates with the city." },
        { num: "03", title: "Choose an operating system", desc: "Pick from the operating systems shown for that machine during setup." },
        { num: "04", title: "Sign in and install", desc: "The server appears in nPanel. Sign in and install the software you need." },
      ]}
      whyPoints={[
        { title: "Nothing shared on the machine", visual: "ownership", desc: "CPU, memory and disks belong to your server for as long as you rent it." },
        { title: "Hardware you can read", visual: "code", desc: "Compare real processor names, disk layouts and port speeds instead of a single size name." },
        { title: "More than a VDS can offer", visual: "growth", desc: "Move here when reserved virtual cores are no longer enough for the workload." },
        { title: "One account for everything", visual: "integrate", desc: "The machine sits in nPanel with your domains, email and invoices." },
      ]}
      whySectionHeadline="Why teams choose a Nisc Cloud dedicated server"
      whySectionVariant="simple"
      contentSlots={{
        afterPricing: <DedicatedPlanFit />,
        afterShowcase: <DedicatedComparison />,
        afterProcess: <DedicatedGettingStarted />,
        beforeFaq: <DedicatedExplained />,
      }}
      faqTitle="Dedicated server questions"
      faqs={[
        {
          q: "What is a dedicated server?",
          a: "A dedicated server is a physical computer in a data centre, rented by one customer. Its CPU, memory and disks are not shared with anyone else.",
        },
        {
          q: "How is it different from a VDS?",
          a: "A VDS is a virtual server with dedicated vCPU cores, still on shared hardware. A dedicated server is the physical machine itself, with the processor, memory and disks named on the card.",
        },
        {
          q: "What is included with every dedicated server?",
          a: "Every machine is a physical server used only by you, with the CPU, memory and disks shown on the card. Bandwidth and port speed are on the card too, because they differ between machines. You manage the operating system.",
        },
        {
          q: "Is the server managed?",
          a: "No. You look after the operating system, updates and the software you install. If you want hosting managed for you, choose Web Hosting or WordPress Hosting.",
        },
        {
          q: "How do I choose a machine?",
          a: "Start with cores and memory, then read the CPU model, the disks and the port speed. Two machines with the same core count can differ in all three, and in price.",
        },
        {
          q: "Why do similar machines cost different amounts?",
          a: "Price follows the processor model, the amount and type of disk, the port speed and the city. Compare the row, not just the core count.",
        },
        {
          q: "Where are the servers located?",
          a: "Each row lists the cities where that machine is in stock. Cities can be in the United States, Europe or Asia. Choose a city on the row before checkout.",
        },
        {
          q: "Can I get the same machine in more than one city?",
          a: "Sometimes. When a build is in stock in several cities, those cities are on the location list and the price follows the city you pick.",
        },
        {
          q: "How much bandwidth do I get?",
          a: "Bandwidth and the network port are listed on each machine. Many include 20TB on a 1Gbps or 10Gbps port, and some include a different amount, so read the row.",
        },
        {
          q: "Which operating systems can I choose?",
          a: "The operating systems available for that machine are shown when you configure it. You manage whichever system you choose.",
        },
        {
          q: "Can I install my own software?",
          a: "Yes. You manage the server, so you can install the software your workload needs, as long as it fits the machine and follows our Acceptable Use Policy.",
        },
        {
          q: "Can I change machines later?",
          a: "Contact us when you need a different processor, more memory or a different city, and we will match you to a machine that is in stock.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Prices can differ by city."
      ctaHeadline="A whole machine, ready when you are"
      ctaSubtext="Physical servers with the CPU, memory and disks on the card, managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
