import { lazy, Suspense, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils.ts";

type StoryComponent = ComponentType<{ active?: boolean; compact?: boolean }>;

const DomainsStory = lazy(() => import("./domains-story.tsx").then((module) => ({ default: module.DomainsStory })));
const HostingStory = lazy(() => import("./hosting-story.tsx").then((module) => ({ default: module.HostingStory })));
const CloudServersStory = lazy(() => import("./cloud-servers-story.tsx").then((module) => ({ default: module.CloudServersStory })));
const BusinessEmailStory = lazy(() => import("./business-email-story.tsx").then((module) => ({ default: module.BusinessEmailStory })));
const SeoStory = lazy(() => import("./seo-story.tsx").then((module) => ({ default: module.SeoStory })));
const EmailMarketingStory = lazy(() => import("./email-marketing-story.tsx").then((module) => ({ default: module.EmailMarketingStory })));

const STORIES: {
  id: string;
  label: string;
  title: string;
  body: string;
  Story: StoryComponent;
}[] = [
  { id: "domains", label: "Domains", title: "Move from search to DNS-ready", body: "Find a name, prepare a registration or transfer, then manage the active domain and DNS from the same account.", Story: DomainsStory },
  { id: "hosting", label: "Hosting", title: "Keep website tools connected", body: "Review service health and move between DNS, mail, files and WordPress without losing the context of the hosting service.", Story: HostingStory },
  { id: "cloud", label: "Cloud servers", title: "Configure and monitor compute", body: "Choose an available configuration and region, follow provisioning, then review the running instance and its resource use.", Story: CloudServersStory },
  { id: "email", label: "Business email", title: "Manage mailboxes and licence mix", body: "Set up mailboxes, match collaboration licences to the people who need them and verify routing before migration.", Story: BusinessEmailStory },
  { id: "seo", label: "SEO", title: "Turn reviews into clear priorities", body: "Bring technical findings, search opportunities and agreed next actions into one understandable report.", Story: SeoStory },
  { id: "marketing", label: "Email marketing", title: "Plan, approve and understand campaigns", body: "Move from a consent-based audience through review and send, then read aggregate reporting in the same workflow.", Story: EmailMarketingStory },
];

export function PlatformStories() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = STORIES[active]!;
  const ActiveStory = selected.Story;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = active;
    if (event.key === "ArrowRight") next = (active + 1) % STORIES.length;
    if (event.key === "ArrowLeft") next = (active - 1 + STORIES.length) % STORIES.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = STORIES.length - 1;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Explore nPanel workflows"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2"
      >
        {STORIES.map((story, index) => (
          <button
            key={story.id}
            ref={(node) => { tabRefs.current[index] = node; }}
            type="button"
            role="tab"
            id={`npanel-tab-${story.id}`}
            aria-controls={`npanel-panel-${story.id}`}
            aria-selected={index === active}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              index === active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {story.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`npanel-panel-${selected.id}`}
        aria-labelledby={`npanel-tab-${selected.id}`}
        className="mt-7 grid items-center gap-8 lg:grid-cols-[minmax(240px,.68fr)_minmax(0,1.55fr)] lg:gap-12"
      >
        <div>
          <p className="text-sm font-semibold text-primary">{selected.label} in nPanel</p>
          <h3 className="type-h2 mt-2 text-balance">{selected.title}</h3>
          <p className="mt-4 leading-relaxed text-muted-foreground">{selected.body}</p>
        </div>
        <Suspense fallback={<div className="min-h-[380px] rounded-[28px] bg-muted" aria-label="Loading nPanel story" />}>
          <ActiveStory active />
        </Suspense>
      </div>
    </div>
  );
}
