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
    name: "Smaller machines",
    level: 1,
    bestFor: "4–6 cores · 16–32 GB memory",
    chooseIf: "You have one busy application or database and want the whole machine to yourself.",
  },
  {
    name: "Mid-size machines",
    level: 2,
    bestFor: "8 cores · around 64 GB memory",
    chooseIf: "You run a heavier database or several services and want more memory than a VDS offers.",
    recommended: true,
  },
  {
    name: "Large machines",
    level: 3,
    bestFor: "16 cores, or 128 GB memory and above",
    chooseIf: "You have a workload that needs a large physical CPU, a lot of memory, or many disks.",
  },
];

export function DedicatedPlanFit() {
  return (
    <ContentBand
      id="which-plan"
      label="Choosing a machine"
      title="Which dedicated server do you need?"
      answer="Match the cores and memory on the card to what your workload uses today, then check the disks and the port speed. Two machines with the same core count can differ in CPU model, disks, city and price."
    >
      <PlanFitGrid
        plans={PLAN_FIT}
        contactHref="/contact?serviceName=Dedicated%20Servers"
        note={
          <>
            <span className="font-semibold">Not sure?</span> Filter the list by core count and compare memory and disks.
            Every machine lists its bandwidth and port speed on the card. You manage the operating system.
          </>
        }
      />
    </ContentBand>
  );
}

export function DedicatedComparison() {
  return (
    <ContentBand
      id="compare-servers"
      tone="muted"
      label="Compare"
      title="VPS, VDS or a dedicated server?"
      answer="Choose a VPS or VDS when a virtual server is enough. Choose a dedicated server when you need a physical CPU, memory and disks that no other customer uses."
    >
      <ComparisonTable
        caption="Comparison of VPS, VDS and dedicated servers"
        highlight={2}
        links
        columns={[
          { title: "VPS", href: "/hosting/vps" },
          { title: "VDS", href: "/hosting/vds" },
          { title: "Dedicated Server", href: "#plans" },
        ]}
        rows={[
          {
            label: "Best for",
            cells: [
              "Apps, APIs, stores and developer projects",
              "Workloads that need cores reserved for them",
              "Workloads that need a whole physical machine",
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

export function DedicatedGettingStarted() {
  return (
    <ContentBand
      id="getting-started"
      label="Getting started"
      title="What happens after you order a dedicated server?"
      answer="You choose a machine and a city, pick the operating system shown for that machine, and the server is prepared for you to manage."
    >
      <StepList
        steps={[
          "Filter by cores, then choose a machine and a city.",
          "Complete checkout and pick the operating system shown for that machine.",
          "The server is prepared and appears in nPanel.",
          "Sign in and install the software your workload needs.",
          "Point your domain at the server when you are ready to go live.",
        ]}
      />
      <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
        A dedicated server is unmanaged: you look after the operating system, updates and the software you install. If
        you want hosting managed for you, choose Web Hosting or WordPress Hosting.
      </p>
      <RelatedLinks
        className="mt-5"
        links={[
          { label: "VDS Hosting", href: "/hosting/vds" },
          { label: "Web Hosting", href: "/hosting/web-hosting" },
        ]}
      />
    </ContentBand>
  );
}

export function DedicatedExplained() {
  return (
    <ContentBand
      id="dedicated-explained"
      tone="muted"
      label="Dedicated servers explained"
      title="What is a dedicated server?"
      answer="A dedicated server is a physical computer in a data centre, used only by you for the time you rent it. Its CPU, memory and disks are not shared with another customer."
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-10">
          <Prose
            paragraphs={[
              "A VDS still runs on shared hardware, with its virtual cores reserved for you. A dedicated server is the hardware itself: the processor model, the memory and the disks on the card are the machine you get.",
              "Machines differ. One 6-core server can have 16 GB of memory and an SSD, another 64 GB and NVMe, and the network port can be 1Gbps or 10Gbps. Bandwidth is often 20TB and sometimes another amount. Read the row, not just the core count.",
            ]}
          />
          <div>
            <h3 className="type-h3">Where are the machines?</h3>
            <p className="mt-3 max-w-[70ch] border-l-4 border-primary pl-4 text-base font-medium leading-relaxed text-foreground">
              Each row lists the cities where that exact machine is in stock. Cities can be in the United States, Europe or Asia, and the same build is sometimes offered in more than one city.
            </p>
            <Prose
              className="mt-4"
              paragraphs={[
                "Pick a city close to the people or systems that talk to the server. For a public website, a CDN still helps, because a single data centre is far from some visitors.",
              ]}
            />
          </div>
        </div>
        <div>
          <h3 className="type-h3 mb-4">Dedicated server terms explained</h3>
          <Glossary
            items={[
              { term: "Dedicated server", desc: "A physical server rented by one customer. The CPU, memory and disks are not shared." },
              { term: "Cores and threads", desc: "Cores are physical processor units. Threads let each core work on more than one task." },
              { term: "NVMe, SSD and HDD", desc: "Disk types. NVMe and SSD are faster. HDD holds more data for less speed. The card lists what that machine has." },
              { term: "Port speed", desc: "How fast the network connection is, shown as 1Gbps or 10Gbps on the card." },
              { term: "Bandwidth", desc: "How much data the server can send in a month. The amount is on the card, often 20TB, sometimes more or less." },
              { term: "Unmanaged", desc: "You install updates and the software you run. Nisc Cloud provides the machine." },
            ]}
          />
        </div>
      </div>
    </ContentBand>
  );
}
