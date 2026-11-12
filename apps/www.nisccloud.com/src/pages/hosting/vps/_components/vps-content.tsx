import {
  ComparisonTable,
  ContentBand,
  Glossary,
  PlanFitGrid,
  Prose,
  RelatedLinks,
  StepList,
  type PlanFit,
} from "@/pages/_components/ContentBlocks.tsx";
import { VpsFirstMinutesArt } from "./VpsFirstMinutesArt.tsx";

const PLAN_FIT: PlanFit[] = [
  {
    name: "Starter",
    level: 1,
    bestFor: "2 cores · 4 GB memory",
    chooseIf: "You need a staging server, a bot, a VPN or a small app that does not get much traffic yet.",
  },
  {
    name: "Pro",
    level: 2,
    bestFor: "4 cores · 8 GB memory",
    chooseIf: "You run a busy website, an online store or an API with a database on the same server.",
    recommended: true,
  },
  {
    name: "Scale",
    level: 3,
    bestFor: "8 cores · 16 GB memory",
    chooseIf: "You run several apps, a large database or background jobs that need room to work.",
  },
  {
    name: "Ultra",
    level: 4,
    bestFor: "12 cores · 24 GB memory",
    chooseIf: "You need the most power a single virtual server offers before moving to VDS or dedicated hardware.",
  },
];

/** Shown straight after the plan cards, while visitors are deciding. */
export function VpsPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a size"
      title="Which VPS size do you need?"
      answer="Start with the memory your application needs, then the cores. Most websites, stores and APIs run well on 4 cores and 8 GB of memory; staging servers and small apps fit 2 cores and 4 GB; databases and several apps need 8 cores or more."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=VPS%20Hosting"
        note={
          <>
            <span className="font-semibold">Not sure?</span> Start smaller and move up a size as traffic grows. Every
            size includes full root access, DDoS protection, backups, a dedicated IPv4 address and 10TB of bandwidth.
          </>
        }
      />
    </ContentBand>
  );
}

/** Shown after the showcase: where a VPS sits among the other hosting types. */
export function VpsComparison() {
  return (
    <ContentBand
      id="compare-servers"
      tone="muted"
      label="Compare"
      title="Web hosting, VPS, VDS or a dedicated server?"
      answer="Choose web hosting when you want websites and email managed for you. Choose a VPS when you need root access to run your own software. Choose a VDS when you need resources reserved only for you, and a dedicated server when you need a whole physical machine."
    >
      <ComparisonTable
        caption="Comparison of web hosting, VPS, VDS and dedicated servers"
        highlight={1}
        links
        columns={[
          { title: "Web Hosting", href: "/hosting/web-hosting" },
          { title: "VPS", href: "#plans" },
          { title: "VDS", href: "/hosting/vds" },
          { title: "Dedicated Server", href: "/hosting/dedicated-servers" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Business websites, WordPress and email",
              "Apps, APIs, stores and developer projects",
              "Workloads that need steady, reserved performance",
              "The heaviest workloads and strict isolation",
            ],
          },
          {
            label: "Access",
            cells: ["Control panel, SSH and command line", "Full root access", "Full root access", "Full root access to the whole machine"],
          },
          {
            label: "Who manages the server",
            cells: ["We do", "You do", "You do", "You do"],
          },
          {
            label: "Resources",
            cells: ["Shared, managed for you", "Virtual cores and memory", "Cores and memory reserved for you", "A whole physical server"],
          },
        ]}
      />
      <RelatedLinks className="mt-6" links={[{ label: "Compare all cloud products", href: "/hosting" }]} />
    </ContentBand>
  );
}

/** Shown after the buying steps: what the first minutes on a new server look like. */
export function VpsGettingStarted() {
  return (
    <ContentBand
      id="getting-started"
      label="Getting started"
      title="What happens after you order a VPS?"
      answer="You choose an operating system and add your SSH key, your server is set up with its own IPv4 address, and you sign in as root to install whatever your project needs."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <div>
          <StepList
            steps={[
              "Choose a size and a server location, then complete checkout.",
              "Pick a Linux distribution or Windows Server, and add your SSH public key.",
              "Your server is set up with a dedicated IPv4 address and appears in nPanel.",
              "Sign in over SSH as root, update the system and install your stack.",
              "Point your domain at the server's IP address when you are ready to go live.",
            ]}
          />
          <p className="mt-6 max-w-[65ch] text-[15px] leading-relaxed text-muted-foreground">
            A VPS is unmanaged: you look after the operating system, updates and the software you install. If you would
            rather we handle the server, choose Web Hosting or WordPress Hosting.
          </p>
          <RelatedLinks
            className="mt-5"
            links={[
              { label: "Web Hosting", href: "/hosting/web-hosting" },
              { label: "WordPress Hosting", href: "/hosting/wordpress" },
            ]}
          />
        </div>
        <VpsFirstMinutesArt />
      </div>
    </ContentBand>
  );
}

/** Reference content near the end of the page. */
export function VpsExplained() {
  return (
    <ContentBand
      id="vps-explained"
      tone="muted"
      label="VPS explained"
      title="What is a VPS?"
      answer="A VPS (virtual private server) is a private section of a powerful physical server, with its own operating system, cores, memory, storage and IP address. You get full root access, so you can install and configure anything your project needs."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "Web hosting runs many websites side by side with the server managed for you, which is simple but limits what software you can install. A VPS gives you your own server environment instead: choose the operating system, run background jobs, open the ports you need and install any language or database.",
              "That freedom comes with responsibility. You keep the operating system updated, configure the firewall and back up what matters, on top of the backups and DDoS protection included with every plan.",
            ]}
          />
          <div>
            <h3 className="type-h3">Where are the servers, and does it matter in Kenya?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
              Each plan card lists its server locations, currently in the United States. Distance adds a little delay
              for visitors in Kenya, which matters less for APIs, background work and development than for websites.
            </p>
            <Prose
              className="mt-4"
              paragraphs={[
                "For a public website on a VPS, put a CDN in front so images and pages are served from closer to your visitors. If you mainly need a fast local website and email, Web Hosting may be the simpler choice.",
              ]}
            />
          </div>
        </div>
        <div>
          <h3 className="type-h3 mb-4">VPS terms explained</h3>
          <Glossary
            items={[
              { term: "Root access", desc: "Full administrator control of the server, so you can install and change anything." },
              { term: "SSH key", desc: "A secure key pair used to sign in to your server instead of a password." },
              { term: "vCPU core", desc: "A share of a physical processor assigned to your server. More cores run more work at once." },
              { term: "Memory (RAM)", desc: "Working space for your apps and database. Running out slows a server down more than anything else." },
              { term: "Bandwidth", desc: "How much data your server can send each month. Every plan includes 10TB on a 1Gbps port." },
              { term: "OS image", desc: "The operating system installed on your server, such as Ubuntu, Debian or Windows Server." },
              { term: "IPv4 address", desc: "Your server's own public address on the internet, used to point your domain at it." },
              { term: "DDoS protection", desc: "Filtering that keeps floods of fake traffic from taking your server offline." },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}
