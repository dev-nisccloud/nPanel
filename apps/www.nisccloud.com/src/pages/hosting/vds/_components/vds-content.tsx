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

const PLAN_FIT: PlanFit[] = [
  {
    name: "Starter",
    level: 1,
    bestFor: "2 dedicated vCPU cores · 4 GB memory",
    chooseIf: "You run one app or a small database and need cores that stay yours.",
  },
  {
    name: "Pro",
    level: 2,
    bestFor: "4 dedicated vCPU cores · 8 GB memory",
    chooseIf: "You run a production app, store or API and want steadier performance than a VPS.",
    recommended: true,
  },
  {
    name: "Power",
    level: 3,
    bestFor: "8 dedicated vCPU cores · 16 GB memory",
    chooseIf: "You run a heavier database or several services that must not compete for cores.",
  },
];

export function VdsPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a size"
      title="Which VDS size do you need?"
      answer="Choose a VDS when a VPS is not steady enough and a whole physical server is more than you need. Start from the memory your app uses, then the dedicated cores."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=VDS%20Hosting"
        note={
          <>
            <span className="font-semibold">Not sure?</span> Pro is the middle size: 4 dedicated cores and 8 GB of memory.
            Every size includes 10TB of bandwidth on a 1Gbps port. You manage the operating system.
          </>
        }
      />
    </ContentBand>
  );
}

export function VdsComparison() {
  return (
    <ContentBand
      id="compare-servers"
      tone="muted"
      label="Compare"
      title="VPS, VDS or a dedicated server?"
      answer="A VPS is a virtual server you manage. A VDS is the same idea with dedicated vCPU cores held for you. A dedicated server is a whole physical machine."
    >
      <ComparisonTable
        caption="Comparison of VPS, VDS and dedicated servers"
        highlight={1}
        links
        columns={[
          { title: "VPS", href: "/hosting/vps" },
          { title: "VDS", href: "#plans" },
          { title: "Dedicated Server", href: "/hosting/dedicated-servers" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Apps, APIs, stores and developer projects",
              "Workloads that need cores reserved for them",
              "The heaviest workloads and a whole machine",
            ],
          },
          {
            label: "Resources",
            cells: ["Virtual cores and memory", "Dedicated vCPU cores", "A physical CPU, memory and disks"],
          },
          {
            label: "Who manages the server",
            cells: ["You do", "You do", "You do"],
          },
          {
            label: "Bandwidth",
            cells: ["10TB on a 1Gbps port", "10TB on a 1Gbps port", "Shown on the card"],
          },
        ]}
      />
      <RelatedLinks className="mt-6" links={[{ label: "Compare all cloud products", href: "/hosting" }]} />
    </ContentBand>
  );
}

export function VdsGettingStarted() {
  return (
    <ContentBand
      id="getting-started"
      label="Getting started"
      title="What happens after you order a VDS?"
      answer="You pick a size and a location, choose an operating system during setup, and the server is prepared with the cores, memory and storage on the card."
    >
      <StepList
        steps={[
          "Choose a size and a server location, then complete checkout.",
          "Pick the operating system shown for that server during configuration.",
          "The server is prepared with its dedicated vCPU cores and appears in nPanel.",
          "Sign in and install the software your project needs.",
          "Point your domain at the server when you are ready to go live.",
        ]}
      />
      <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
        A VDS is unmanaged: you look after the operating system, updates and the software you install. If you want the
        server managed for you, choose Web Hosting or WordPress Hosting.
      </p>
      <RelatedLinks
        className="mt-5"
        links={[
          { label: "Web Hosting", href: "/hosting/web-hosting" },
          { label: "VPS Hosting", href: "/hosting/vps" },
        ]}
      />
    </ContentBand>
  );
}

export function VdsExplained() {
  return (
    <ContentBand
      id="vds-explained"
      tone="muted"
      label="VDS explained"
      title="What is a VDS?"
      answer="A VDS (virtual dedicated server) is a virtual server whose CPU cores are dedicated to you. Other customers' servers do not share those cores, which keeps performance steadier than a VPS when the host is busy."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "On a VPS, virtual cores can be scheduled alongside other customers. A VDS keeps its vCPU cores for your server. Memory and storage are the amounts on the plan card. You still manage the operating system yourself.",
              "Every current VDS size includes 10TB of monthly bandwidth on a 1Gbps port. The cities in stock are listed on each card.",
            ]}
          />
          <div>
            <h3 className="type-h3">Where are the servers, and does it matter in Kenya?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground">
              Each card lists the cities where that size is in stock. Distance adds a little delay for visitors in Kenya, which matters less for APIs and background work than for public websites.
            </p>
            <Prose
              className="mt-4"
              paragraphs={[
                "For a public website, put a CDN in front so pages and images are served from closer to your visitors. If you mainly need a managed website and email, Web Hosting is the simpler product.",
              ]}
            />
          </div>
        </div>
        <div>
          <h3 className="type-h3 mb-4">VDS terms explained</h3>
          <Glossary
            items={[
              { term: "Dedicated vCPU", desc: "A virtual processor core held for your server, not shared with another customer." },
              { term: "VDS", desc: "A virtual server with dedicated vCPU cores. You manage the operating system." },
              { term: "VPS", desc: "A virtual server you manage. Its cores are not dedicated the way a VDS core is." },
              { term: "Memory (RAM)", desc: "Working space for your apps and database. The amount is on the plan card." },
              { term: "Bandwidth", desc: "How much data the server can send in a month. Every VDS includes 10TB on a 1Gbps port." },
              { term: "Unmanaged", desc: "You install updates and the software you run. Nisc Cloud provides the server." },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}
